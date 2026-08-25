import { useCallback, useEffect, useRef, useState } from 'react';
import type { MockEntityState, MockEntityStateMap } from '../types/ha';

export type DeviceCommandPhase =
  | 'idle'
  | 'sending'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'error'
  | 'rollback';

export type DeviceCommandRollbackReason =
  | 'service_rejected'
  | 'service_error'
  | 'confirmation_timeout'
  | 'connection_lost'
  | 'superseded'
  | 'cancelled';

export type DeviceCommandStatus = {
  key: string;
  entityId: string;
  domain: string;
  service: string;
  phase: DeviceCommandPhase;
  startedAt: number;
  updatedAt: number;
  rollbackReason?: DeviceCommandRollbackReason;
  errorMessage?: string;
};

export type DeviceCommandRequest = {
  key?: string;
  entityId: string;
  domain: string;
  service: string;
  timeoutMs?: number;
  confirmation?: 'entity_state' | 'service_response';
  send: () => Promise<boolean>;
  confirm?: (entity: MockEntityState | undefined) => boolean;
  onOptimistic?: () => void;
  onAwaitingConfirmation?: () => void;
  onConfirmed?: (entity: MockEntityState | undefined) => void;
  onRollback?: (reason: DeviceCommandRollbackReason, entity: MockEntityState | undefined) => void;
};

type RuntimeCommand = {
  id: number;
  status: DeviceCommandStatus;
  confirm?: DeviceCommandRequest['confirm'];
  onConfirmed?: DeviceCommandRequest['onConfirmed'];
  onRollback?: DeviceCommandRequest['onRollback'];
  timeoutId?: ReturnType<typeof globalThis.setTimeout>;
};

function commandKey(request: DeviceCommandRequest) {
  return request.key?.trim() || `${request.domain}.${request.service}:${request.entityId}`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'Comando non completato';
}

export function useDeviceCommandCoordinator({
  entities,
  isReliable,
  defaultTimeoutMs = 8000,
}: {
  entities: MockEntityStateMap;
  isReliable: boolean;
  defaultTimeoutMs?: number;
}) {
  const [statuses, setStatuses] = useState<Record<string, DeviceCommandStatus>>({});
  const runtimeRef = useRef<Map<string, RuntimeCommand>>(new Map());
  const entitiesRef = useRef(entities);
  const reliableRef = useRef(isReliable);
  const sequenceRef = useRef(0);
  const mountedRef = useRef(true);
  entitiesRef.current = entities;
  reliableRef.current = isReliable;

  const publish = useCallback((status: DeviceCommandStatus) => {
    if (!mountedRef.current) return;
    setStatuses((current) => ({ ...current, [status.key]: status }));
  }, []);

  const clearRuntimeTimer = useCallback((runtime: RuntimeCommand) => {
    if (runtime.timeoutId !== undefined) {
      globalThis.clearTimeout(runtime.timeoutId);
      runtime.timeoutId = undefined;
    }
  }, []);

  const settleConfirmed = useCallback((key: string, expectedId?: number) => {
    const runtime = runtimeRef.current.get(key);
    if (!runtime || (expectedId !== undefined && runtime.id !== expectedId)) return false;
    clearRuntimeTimer(runtime);
    const entity = entitiesRef.current[runtime.status.entityId];
    runtime.status = {
      ...runtime.status,
      phase: 'confirmed',
      updatedAt: Date.now(),
      rollbackReason: undefined,
      errorMessage: undefined,
    };
    runtimeRef.current.delete(key);
    publish(runtime.status);
    runtime.onConfirmed?.(entity);
    return true;
  }, [clearRuntimeTimer, publish]);

  const settleRollback = useCallback((
    key: string,
    reason: DeviceCommandRollbackReason,
    phase: 'error' | 'rollback' = 'rollback',
    message?: string,
    expectedId?: number,
  ) => {
    const runtime = runtimeRef.current.get(key);
    if (!runtime || (expectedId !== undefined && runtime.id !== expectedId)) return false;
    clearRuntimeTimer(runtime);
    const entity = entitiesRef.current[runtime.status.entityId];
    runtime.status = {
      ...runtime.status,
      phase,
      updatedAt: Date.now(),
      rollbackReason: reason,
      errorMessage: message,
    };
    runtimeRef.current.delete(key);
    publish(runtime.status);
    runtime.onRollback?.(reason, entity);
    return true;
  }, [clearRuntimeTimer, publish]);

  const run = useCallback(async (request: DeviceCommandRequest) => {
    const key = commandKey(request);
    const now = Date.now();
    if (!reliableRef.current) {
      const status: DeviceCommandStatus = {
        key,
        entityId: request.entityId,
        domain: request.domain,
        service: request.service,
        phase: 'error',
        startedAt: now,
        updatedAt: now,
        rollbackReason: 'connection_lost',
        errorMessage: 'Connessione Home Assistant non affidabile',
      };
      publish(status);
      request.onRollback?.('connection_lost', entitiesRef.current[request.entityId]);
      return false;
    }

    settleRollback(key, 'superseded');
    const id = sequenceRef.current + 1;
    sequenceRef.current = id;
    const status: DeviceCommandStatus = {
      key,
      entityId: request.entityId,
      domain: request.domain,
      service: request.service,
      phase: 'sending',
      startedAt: now,
      updatedAt: now,
    };
    const runtime: RuntimeCommand = {
      id,
      status,
      confirm: request.confirm,
      onConfirmed: request.onConfirmed,
      onRollback: request.onRollback,
    };
    runtimeRef.current.set(key, runtime);
    request.onOptimistic?.();
    publish(status);

    let accepted = false;
    try {
      accepted = await request.send();
    } catch (error) {
      settleRollback(key, 'service_error', 'error', errorMessage(error), id);
      return false;
    }

    const active = runtimeRef.current.get(key);
    if (!active || active.id !== id) return false;
    if (!accepted) {
      settleRollback(key, 'service_rejected', 'error', 'Home Assistant ha rifiutato il comando', id);
      return false;
    }
    if (!reliableRef.current) {
      settleRollback(key, 'connection_lost', 'rollback', 'Connessione persa durante il comando', id);
      return false;
    }

    if (request.confirmation === 'service_response') {
      settleConfirmed(key, id);
      return true;
    }

    const entity = entitiesRef.current[request.entityId];
    if (request.confirm?.(entity)) {
      settleConfirmed(key, id);
      return true;
    }

    active.status = {
      ...active.status,
      phase: 'awaiting_confirmation',
      updatedAt: Date.now(),
    };
    publish(active.status);
    request.onAwaitingConfirmation?.();
    const timeoutMs = Math.max(500, request.timeoutMs ?? defaultTimeoutMs);
    active.timeoutId = globalThis.setTimeout(() => {
      settleRollback(
        key,
        'confirmation_timeout',
        'rollback',
        'Home Assistant non ha confermato il nuovo stato',
        id,
      );
    }, timeoutMs);
    return true;
  }, [defaultTimeoutMs, publish, settleConfirmed, settleRollback]);

  const cancelAll = useCallback((reason: DeviceCommandRollbackReason = 'cancelled') => {
    [...runtimeRef.current.keys()].forEach((key) => settleRollback(key, reason));
  }, [settleRollback]);

  const cancel = useCallback((key: string, reason: DeviceCommandRollbackReason = 'cancelled') => (
    settleRollback(key, reason)
  ), [settleRollback]);

  const clearStatus = useCallback((key: string) => {
    if (!mountedRef.current) return;
    setStatuses((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isReliable) {
      cancelAll('connection_lost');
      return;
    }
    runtimeRef.current.forEach((runtime, key) => {
      if (runtime.status.phase !== 'awaiting_confirmation') return;
      const entity = entities[runtime.status.entityId];
      if (runtime.confirm?.(entity)) settleConfirmed(key, runtime.id);
    });
  }, [cancelAll, entities, isReliable, settleConfirmed]);

  useEffect(() => () => {
    mountedRef.current = false;
    runtimeRef.current.forEach(clearRuntimeTimer);
    runtimeRef.current.clear();
  }, [clearRuntimeTimer]);

  return {
    statuses,
    run,
    cancel,
    cancelAll,
    clearStatus,
  };
}
