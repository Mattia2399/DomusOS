import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HassEntities } from 'home-assistant-js-websocket';
import { mapHassEntitiesToMock, normalizeHassUrl } from '../services/haLive';
import type { MockEntityStateMap } from '../types/ha';
import type { HaArea, HaConnectionStatus } from './useHaLiveConnection';

type HaPanelPayloadBase = {
  type: string;
};

type HaPanelContextPayload = HaPanelPayloadBase & {
  type: 'ha-panel-context';
  hassUrl?: unknown;
  user?: unknown;
  locale?: unknown;
};

type HaPanelSnapshotPayload = HaPanelPayloadBase & {
  type: 'ha-panel-snapshot';
  hassUrl?: unknown;
  user?: unknown;
  locale?: unknown;
  states?: unknown;
  areas?: unknown;
};

type HaPanelStateChangedPayload = HaPanelPayloadBase & {
  type: 'ha-panel-state-changed';
  entityId?: unknown;
  state?: unknown;
};

type HaPanelCallServiceResultPayload = HaPanelPayloadBase & {
  type: 'ha-panel-call-service-result';
  requestId?: unknown;
  ok?: unknown;
  error?: unknown;
};

type HaPanelCallApiResultPayload = HaPanelPayloadBase & {
  type: 'ha-panel-call-api-result';
  requestId?: unknown;
  ok?: unknown;
  error?: unknown;
  result?: unknown;
};

type PendingRequestRecord = {
  resolve: (payload: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof globalThis.setTimeout>;
};

const REQUEST_TIMEOUT_MS = 15000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toObjectMap(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }
  return value;
}

function parseAreaRegistryPayload(payload: unknown): HaArea[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => {
      const areaId = typeof entry.area_id === 'string' ? entry.area_id.trim() : '';
      const name = typeof entry.name === 'string' ? entry.name.trim() : '';
      const aliases = Array.isArray(entry.aliases)
        ? entry.aliases.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : undefined;
      const floorId = typeof entry.floor_id === 'string' && entry.floor_id.trim().length > 0 ? entry.floor_id : null;
      const humidityEntityId =
        typeof entry.humidity_entity_id === 'string' && entry.humidity_entity_id.trim().length > 0
          ? entry.humidity_entity_id
          : null;
      const icon = typeof entry.icon === 'string' && entry.icon.trim().length > 0 ? entry.icon : null;
      const picture = typeof entry.picture === 'string' && entry.picture.trim().length > 0 ? entry.picture : undefined;
      const temperatureEntityId =
        typeof entry.temperature_entity_id === 'string' && entry.temperature_entity_id.trim().length > 0
          ? entry.temperature_entity_id
          : null;
      if (!areaId || !name) {
        return null;
      }
      const area: HaArea = { area_id: areaId, name };
      if (aliases && aliases.length > 0) {
        area.aliases = aliases;
      }
      area.floor_id = floorId;
      area.humidity_entity_id = humidityEntityId;
      area.icon = icon;
      if (picture) {
        area.picture = picture;
      }
      area.temperature_entity_id = temperatureEntityId;
      return area;
    })
    .filter((entry): entry is HaArea => entry !== null);
}

function createRequestId(prefix: string) {
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`;
}

export function useHaPanelBridgeConnection() {
  const [status, setStatus] = useState<HaConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [haStates, setHaStates] = useState<MockEntityStateMap>({});
  const [haAreas, setHaAreas] = useState<HaArea[]>([]);
  const [isManagedByParent, setIsManagedByParent] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const hassUrlRef = useRef<string>(typeof window !== 'undefined' ? window.location.origin : '');
  const rawStatesRef = useRef<Record<string, unknown>>({});
  const pendingRequestsRef = useRef<Map<string, PendingRequestRecord>>(new Map());

  const isInIframe = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.parent !== window;
  }, []);

  const postToParent = useCallback((payload: Record<string, unknown>) => {
    if (typeof window === 'undefined') {
      return false;
    }
    if (window.parent === window) {
      return false;
    }
    window.parent.postMessage(payload, window.location.origin);
    return true;
  }, []);

  const rejectPendingRequest = useCallback((requestId: string, reason: Error) => {
    const pending = pendingRequestsRef.current.get(requestId);
    if (!pending) {
      return;
    }
    pendingRequestsRef.current.delete(requestId);
    globalThis.clearTimeout(pending.timeoutId);
    pending.reject(reason);
  }, []);

  const resolvePendingRequest = useCallback((requestId: string, payload: unknown) => {
    const pending = pendingRequestsRef.current.get(requestId);
    if (!pending) {
      return;
    }
    pendingRequestsRef.current.delete(requestId);
    globalThis.clearTimeout(pending.timeoutId);
    pending.resolve(payload);
  }, []);

  const sendRequest = useCallback(
    <TResponse = unknown,>(
      type: 'ha-panel-call-service' | 'ha-panel-call-api',
      payload: Record<string, unknown>,
    ) => {
      if (!isInIframe || !isManagedByParent || isPaused) {
        return Promise.reject(new Error('Bridge Home Assistant non disponibile.'));
      }

      const requestId = createRequestId(type);
      return new Promise<TResponse>((resolve, reject) => {
        const timeoutId = globalThis.setTimeout(() => {
          rejectPendingRequest(requestId, new Error('Timeout richiesta verso Home Assistant.'));
        }, REQUEST_TIMEOUT_MS);
        pendingRequestsRef.current.set(requestId, {
          resolve: (value) => resolve(value as TResponse),
          reject,
          timeoutId,
        });

        const posted = postToParent({
          type,
          requestId,
          ...payload,
        });
        if (!posted) {
          rejectPendingRequest(requestId, new Error('Invio richiesta al pannello Home Assistant fallito.'));
        }
      });
    },
    [isInIframe, isManagedByParent, isPaused, postToParent, rejectPendingRequest],
  );

  const applySnapshot = useCallback((payload: HaPanelSnapshotPayload) => {
    const urlCandidate = typeof payload.hassUrl === 'string' ? normalizeHassUrl(payload.hassUrl) : '';
    if (urlCandidate) {
      hassUrlRef.current = urlCandidate;
    }

    const stateMap = toObjectMap(payload.states);
    if (stateMap) {
      rawStatesRef.current = stateMap;
      setHaStates((current) =>
        mapHassEntitiesToMock(stateMap as unknown as HassEntities, hassUrlRef.current, current),
      );
    }

    if (payload.areas !== undefined) {
      setHaAreas(parseAreaRegistryPayload(payload.areas));
    }
  }, []);

  const applyStateChanged = useCallback((payload: HaPanelStateChangedPayload) => {
    const entityId = typeof payload.entityId === 'string' ? payload.entityId.trim() : '';
    if (!entityId) {
      return;
    }

    if (payload.state === null || payload.state === undefined) {
      delete rawStatesRef.current[entityId];
      setHaStates((current) => {
        if (!Object.prototype.hasOwnProperty.call(current, entityId)) {
          return current;
        }
        const next = { ...current };
        delete next[entityId];
        return next;
      });
      return;
    }

    if (!isRecord(payload.state)) {
      return;
    }

    rawStatesRef.current[entityId] = payload.state;
    setHaStates((current) => {
      const mapped = mapHassEntitiesToMock(
        { [entityId]: payload.state } as unknown as HassEntities,
        hassUrlRef.current,
        current,
      );
      return {
        ...current,
        ...mapped,
      };
    });
  }, []);

  useEffect(() => {
    if (!isInIframe || typeof window === 'undefined') {
      return;
    }

    if (!isManagedByParent) {
      setStatus('connecting');
      postToParent({ type: 'ha-panel-ready' });
      postToParent({ type: 'ha-panel-request-sync' });
    }

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent) {
        return;
      }
      if (event.origin !== window.location.origin) {
        return;
      }
      if (!isRecord(event.data)) {
        return;
      }

      const payload = event.data as HaPanelPayloadBase;

      if (payload.type === 'ha-panel-context') {
        const contextPayload = payload as HaPanelContextPayload;
        const urlCandidate =
          typeof contextPayload.hassUrl === 'string'
            ? normalizeHassUrl(contextPayload.hassUrl)
            : '';
        if (urlCandidate) {
          hassUrlRef.current = urlCandidate;
        }
        setIsManagedByParent(true);
        if (!isPaused) {
          setStatus('connecting');
        }
        setError(null);
        return;
      }

      if (payload.type === 'ha-panel-snapshot') {
        if (isPaused) {
          return;
        }
        setIsManagedByParent(true);
        applySnapshot(payload as HaPanelSnapshotPayload);
        setStatus('connected');
        setError(null);
        return;
      }

      if (payload.type === 'ha-panel-state-changed') {
        if (isPaused) {
          return;
        }
        setIsManagedByParent(true);
        applyStateChanged(payload as HaPanelStateChangedPayload);
        setStatus('connected');
        setError(null);
        return;
      }

      if (payload.type === 'ha-panel-call-service-result') {
        const resultPayload = payload as HaPanelCallServiceResultPayload;
        const requestId = typeof resultPayload.requestId === 'string' ? resultPayload.requestId : '';
        if (!requestId) {
          return;
        }
        const ok = resultPayload.ok === true;
        if (ok) {
          resolvePendingRequest(requestId, true);
        } else {
          const message =
            typeof resultPayload.error === 'string' && resultPayload.error.trim().length > 0
              ? resultPayload.error
              : 'Richiesta Home Assistant fallita.';
          rejectPendingRequest(requestId, new Error(message));
        }
        return;
      }

      if (payload.type === 'ha-panel-call-api-result') {
        const resultPayload = payload as HaPanelCallApiResultPayload;
        const requestId = typeof resultPayload.requestId === 'string' ? resultPayload.requestId : '';
        if (!requestId) {
          return;
        }
        const ok = resultPayload.ok === true;
        if (ok) {
          resolvePendingRequest(requestId, resultPayload.result);
        } else {
          const message =
            typeof resultPayload.error === 'string' && resultPayload.error.trim().length > 0
              ? resultPayload.error
              : 'Richiesta Home Assistant fallita.';
          rejectPendingRequest(requestId, new Error(message));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [
    applySnapshot,
    applyStateChanged,
    isInIframe,
    isManagedByParent,
    isPaused,
    postToParent,
    rejectPendingRequest,
    resolvePendingRequest,
  ]);

  useEffect(() => {
    return () => {
      pendingRequestsRef.current.forEach((pending, requestId) => {
        pendingRequestsRef.current.delete(requestId);
        globalThis.clearTimeout(pending.timeoutId);
        pending.reject(new Error('Bridge Home Assistant chiuso.'));
      });
    };
  }, []);

  const connect = useCallback(async () => {
    if (!isInIframe || !isManagedByParent) {
      setStatus('error');
      setError('Bridge Home Assistant non disponibile in questa pagina.');
      return;
    }
    setIsPaused(false);
    setStatus('connecting');
    setError(null);
    postToParent({ type: 'ha-panel-request-sync' });
  }, [isInIframe, isManagedByParent, postToParent]);

  const disconnect = useCallback(() => {
    setIsPaused(true);
    setStatus('disconnected');
    setError(null);
    setHaStates({});
    setHaAreas([]);
  }, []);

  const callService = useCallback(
    async (domain: string, service: string, serviceData: Record<string, unknown>) => {
      try {
        await sendRequest<boolean>('ha-panel-call-service', {
          domain,
          service,
          serviceData,
        });
        setError(null);
        return true;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Richiesta Home Assistant fallita.');
        return false;
      }
    },
    [sendRequest],
  );

  const callApi = useCallback(
    async <TResponse = unknown,>(
      message: Record<string, unknown>,
      options?: { reportError?: boolean },
    ) => {
      try {
        const response = await sendRequest<TResponse>('ha-panel-call-api', { message });
        if (options?.reportError !== false) {
          setError(null);
        }
        return response;
      } catch (requestError) {
        if (options?.reportError !== false) {
          setError(requestError instanceof Error ? requestError.message : 'Richiesta Home Assistant fallita.');
        }
        return null;
      }
    },
    [sendRequest],
  );

  return {
    isManagedByParent,
    hassUrl: hassUrlRef.current,
    status,
    error,
    haStates,
    haAreas,
    connect,
    disconnect,
    callService,
    callApi,
  };
}

export default useHaPanelBridgeConnection;
