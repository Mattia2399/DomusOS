import { useCallback, useEffect, useRef } from 'react';
import type { MockEntityState } from '../../../types/ha';
import type { DeviceCommandRollbackReason } from '../../../hooks/useDeviceCommandCoordinator';
import { useDeviceCommandCoordinator } from '../../../hooks/useDeviceCommandCoordinator';
import {
  CLIMATE_PENDING_TTL_MS,
  COVER_PENDING_TTL_MS,
  type ClimateQueuedCommand,
  type CoverPendingState,
} from './useClimateCoverPendingController';
import { normalizeLower, toFiniteNumber, toTrimmedString } from './mainBoardValueUtils';

export const CLIMATE_SEND_DELAY_MS = 320;

type CommandCoordinator = Pick<
  ReturnType<typeof useDeviceCommandCoordinator>,
  'run' | 'cancel'
>;

type CallHaService = (
  domain: string,
  service: string,
  serviceData?: Record<string, unknown>,
) => Promise<boolean>;

type ClimatePendingController = {
  clearClimatePendingFields: (
    entityId: string,
    fields: Array<keyof ClimateQueuedCommand>,
  ) => void;
};

type CoverPendingController = {
  upsertCoverPending: (
    entityId: string,
    patch: Partial<Omit<CoverPendingState, 'expiresAt'>>,
  ) => void;
  clearCoverPendingFields: (
    entityId: string,
    fields: Array<'state' | 'position' | 'tiltPosition'>,
  ) => void;
};

export type CoverCommandRequest = {
  entityId: string;
  key: 'cover-motion' | 'cover-tilt';
  service: string;
  payload?: Record<string, unknown>;
  pending: Partial<Omit<CoverPendingState, 'expiresAt'>>;
  fields: Array<'state' | 'position' | 'tiltPosition'>;
  confirm: (entity: MockEntityState | undefined) => boolean;
};

function almostEqual(value: number | undefined, expected: number | undefined, tolerance = 0.15) {
  return (
    Number.isFinite(value) &&
    Number.isFinite(expected) &&
    Math.abs((value as number) - (expected as number)) <= tolerance
  );
}

function isSilentRollback(reason: DeviceCommandRollbackReason) {
  return reason === 'superseded' || reason === 'cancelled' || reason === 'connection_lost';
}

export function useClimateCoverCommandTransport({
  isHaConnected,
  commandCoordinator,
  callHaService,
  pending,
  addNotification,
}: {
  isHaConnected: boolean;
  commandCoordinator: CommandCoordinator;
  callHaService: CallHaService;
  pending: ClimatePendingController & CoverPendingController;
  addNotification: (type: 'alert', message: string) => unknown;
}) {
  const climateSendTimersRef = useRef<Record<string, number>>({});
  const climateQueuedCommandsRef = useRef<Record<string, ClimateQueuedCommand>>({});

  const clearClimateQueue = useCallback((entityId?: string) => {
    if (entityId) {
      const timeoutId = climateSendTimersRef.current[entityId];
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        delete climateSendTimersRef.current[entityId];
      }
      delete climateQueuedCommandsRef.current[entityId];
      return;
    }
    Object.values(climateSendTimersRef.current).forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    climateSendTimersRef.current = {};
    climateQueuedCommandsRef.current = {};
  }, []);

  const flushQueuedClimateCommand = useCallback((entityId: string) => {
    const queued = climateQueuedCommandsRef.current[entityId];
    if (!queued) return;
    delete climateQueuedCommandsRef.current[entityId];

    const runClimateCommand = (
      key: string,
      service: string,
      payload: Record<string, unknown>,
      fields: Array<keyof ClimateQueuedCommand>,
      confirm: (entity: MockEntityState | undefined) => boolean,
    ) => {
      void commandCoordinator.run({
        key: `${key}:${entityId}`,
        entityId,
        domain: 'climate',
        service,
        timeoutMs: CLIMATE_PENDING_TTL_MS,
        send: () => callHaService('climate', service, { entity_id: entityId, ...payload }),
        confirm,
        onRollback: (reason) => {
          if (reason !== 'superseded') pending.clearClimatePendingFields(entityId, fields);
        },
      });
    };

    if (Number.isFinite(queued.targetTempLow) && Number.isFinite(queued.targetTempHigh)) {
      const targetLow = queued.targetTempLow as number;
      const targetHigh = queued.targetTempHigh as number;
      runClimateCommand(
        'climate-temperature',
        'set_temperature',
        { target_temp_low: targetLow, target_temp_high: targetHigh },
        ['targetTemp', 'targetTempLow', 'targetTempHigh'],
        (entity) => {
          const attributes = entity?.rawAttributes;
          const liveLow = toFiniteNumber(entity?.targetTempLow) ?? toFiniteNumber(attributes?.target_temp_low);
          const liveHigh = toFiniteNumber(entity?.targetTempHigh) ?? toFiniteNumber(attributes?.target_temp_high);
          return almostEqual(liveLow, targetLow) && almostEqual(liveHigh, targetHigh);
        },
      );
    } else if (Number.isFinite(queued.targetTemp)) {
      const target = queued.targetTemp as number;
      runClimateCommand(
        'climate-temperature',
        'set_temperature',
        { temperature: target },
        ['targetTemp', 'targetTempLow', 'targetTempHigh'],
        (entity) => {
          const liveTarget =
            toFiniteNumber(entity?.targetValue) ??
            toFiniteNumber(entity?.rawAttributes?.temperature);
          return almostEqual(liveTarget, target);
        },
      );
    }

    const queuedFanMode = normalizeLower(queued.fanMode);
    if (queuedFanMode) {
      runClimateCommand(
        'climate-fan',
        'set_fan_mode',
        { fan_mode: queuedFanMode },
        ['fanMode'],
        (entity) =>
          normalizeLower(
            toTrimmedString(entity?.fanMode) ??
              toTrimmedString(entity?.rawAttributes?.fan_mode),
          ) === queuedFanMode,
      );
    }

    if (Number.isFinite(queued.targetHumidity)) {
      const humidity = queued.targetHumidity as number;
      runClimateCommand(
        'climate-humidity',
        'set_humidity',
        { humidity },
        ['targetHumidity'],
        (entity) => {
          const liveHumidity =
            toFiniteNumber(entity?.targetHumidity) ??
            toFiniteNumber(entity?.rawAttributes?.humidity);
          return almostEqual(liveHumidity, humidity, 0.5);
        },
      );
    }

    const queuedPresetMode = normalizeLower(queued.presetMode);
    if (queuedPresetMode) {
      runClimateCommand(
        'climate-preset',
        'set_preset_mode',
        { preset_mode: queuedPresetMode },
        ['presetMode'],
        (entity) =>
          normalizeLower(
            toTrimmedString(entity?.presetMode) ??
              toTrimmedString(entity?.rawAttributes?.preset_mode),
          ) === queuedPresetMode,
      );
    }

    const queuedSwingMode = normalizeLower(queued.swingMode);
    if (queuedSwingMode) {
      runClimateCommand(
        'climate-swing',
        'set_swing_mode',
        { swing_mode: queuedSwingMode },
        ['swingMode'],
        (entity) =>
          normalizeLower(
            toTrimmedString(entity?.swingMode) ??
              toTrimmedString(entity?.rawAttributes?.swing_mode),
          ) === queuedSwingMode,
      );
    }

    const queuedSwingHorizontalMode = normalizeLower(queued.swingHorizontalMode);
    if (queuedSwingHorizontalMode) {
      runClimateCommand(
        'climate-swing-horizontal',
        'set_swing_horizontal_mode',
        { swing_horizontal_mode: queuedSwingHorizontalMode },
        ['swingHorizontalMode'],
        (entity) =>
          normalizeLower(
            toTrimmedString(entity?.swingHorizontalMode) ??
              toTrimmedString(entity?.rawAttributes?.swing_horizontal_mode),
          ) === queuedSwingHorizontalMode,
      );
    }
  }, [callHaService, commandCoordinator, pending]);

  const queueClimateCommandDispatch = useCallback((
    entityId: string,
    patch: Partial<ClimateQueuedCommand>,
  ) => {
    if ('targetTemp' in patch || 'targetTempLow' in patch || 'targetTempHigh' in patch) {
      commandCoordinator.cancel(`climate-temperature:${entityId}`, 'superseded');
    }
    if ('fanMode' in patch) commandCoordinator.cancel(`climate-fan:${entityId}`, 'superseded');
    if ('targetHumidity' in patch) commandCoordinator.cancel(`climate-humidity:${entityId}`, 'superseded');
    if ('presetMode' in patch) commandCoordinator.cancel(`climate-preset:${entityId}`, 'superseded');
    if ('swingMode' in patch) commandCoordinator.cancel(`climate-swing:${entityId}`, 'superseded');
    if ('swingHorizontalMode' in patch) {
      commandCoordinator.cancel(`climate-swing-horizontal:${entityId}`, 'superseded');
    }

    climateQueuedCommandsRef.current[entityId] = {
      ...(climateQueuedCommandsRef.current[entityId] ?? {}),
      ...patch,
    };
    const existingTimeout = climateSendTimersRef.current[entityId];
    if (existingTimeout !== undefined) window.clearTimeout(existingTimeout);
    climateSendTimersRef.current[entityId] = window.setTimeout(() => {
      delete climateSendTimersRef.current[entityId];
      flushQueuedClimateCommand(entityId);
    }, CLIMATE_SEND_DELAY_MS);
  }, [commandCoordinator, flushQueuedClimateCommand]);

  const runCoverCommand = useCallback(({
    entityId,
    key,
    service,
    payload = {},
    pending: optimisticPending,
    fields,
    confirm,
  }: CoverCommandRequest) => {
    void commandCoordinator.run({
      key: `${key}:${entityId}`,
      entityId,
      domain: 'cover',
      service,
      timeoutMs: COVER_PENDING_TTL_MS,
      onOptimistic: () => pending.upsertCoverPending(entityId, optimisticPending),
      send: () => callHaService('cover', service, { entity_id: entityId, ...payload }),
      confirm,
      onConfirmed: () => pending.clearCoverPendingFields(entityId, fields),
      onRollback: (reason) => {
        if (reason !== 'superseded') pending.clearCoverPendingFields(entityId, fields);
        if (!isSilentRollback(reason)) {
          addNotification('alert', 'La cover non ha confermato il comando.');
        }
      },
    });
  }, [addNotification, callHaService, commandCoordinator, pending]);

  useEffect(() => {
    if (!isHaConnected) clearClimateQueue();
  }, [clearClimateQueue, isHaConnected]);

  useEffect(() => () => clearClimateQueue(), [clearClimateQueue]);

  return {
    queueClimateCommandDispatch,
    runCoverCommand,
  };
}
