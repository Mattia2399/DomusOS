import { useCallback, useEffect, useRef, useState } from 'react';
import type { MockEntityStateMap } from '../../../types/ha';
import {
  normalizeCoverState,
  resolveCoverPosition,
  resolveCoverPositionAttribute,
  resolveCoverTiltAttribute,
  resolveCoverTiltPosition,
} from '../../../utils/coverUtils';
import { normalizeLower, toFiniteNumber, toTrimmedString } from './mainBoardValueUtils';

export const CLIMATE_PENDING_TTL_MS = 15000;
export const CLIMATE_PENDING_CONFIRMATION_HOLD_MS = 650;
export const COVER_PENDING_TTL_MS = 7000;

export type ClimatePendingState = {
  targetTemp?: number;
  targetTempLow?: number;
  targetTempHigh?: number;
  fanMode?: string;
  targetHumidity?: number;
  presetMode?: string;
  swingMode?: string;
  swingHorizontalMode?: string;
  expiresAt: number;
};

export type ClimateQueuedCommand = Omit<ClimatePendingState, 'expiresAt'>;

export type CoverPendingState = {
  state?: string;
  position?: number;
  tiltPosition?: number;
  expiresAt: number;
};

function almostEqual(value: number | undefined, expected: number | undefined, tolerance = 0.15) {
  return (
    Number.isFinite(value) &&
    Number.isFinite(expected) &&
    Math.abs((value as number) - (expected as number)) <= tolerance
  );
}

export function hasClimatePendingValues(value: ClimatePendingState | undefined) {
  return Boolean(
    value &&
      (Number.isFinite(value.targetTemp) ||
        Number.isFinite(value.targetTempLow) ||
        Number.isFinite(value.targetTempHigh) ||
        Number.isFinite(value.targetHumidity) ||
        normalizeLower(value.fanMode) ||
        normalizeLower(value.presetMode) ||
        normalizeLower(value.swingMode) ||
        normalizeLower(value.swingHorizontalMode)),
  );
}

export function hasCoverPendingValues(value: CoverPendingState | undefined) {
  return Boolean(
    value &&
      (normalizeLower(value.state) ||
        Number.isFinite(value.position) ||
        Number.isFinite(value.tiltPosition)),
  );
}

function clearTimer(registry: Record<string, number>, entityId: string) {
  const timeoutId = registry[entityId];
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    delete registry[entityId];
  }
}

function clearRegistry(registry: Record<string, number>) {
  Object.values(registry).forEach((timeoutId) => window.clearTimeout(timeoutId));
  Object.keys(registry).forEach((entityId) => delete registry[entityId]);
}

export function useClimateCoverPendingController({
  haStates,
  isHaConnected,
}: {
  haStates: MockEntityStateMap;
  isHaConnected: boolean;
}) {
  const [climatePendingByEntity, setClimatePendingByEntity] = useState<
    Record<string, ClimatePendingState>
  >({});
  const [coverPendingByEntity, setCoverPendingByEntity] = useState<
    Record<string, CoverPendingState>
  >({});
  const climateExpiryTimersRef = useRef<Record<string, number>>({});
  const climateConfirmationTimersRef = useRef<Record<string, number>>({});
  const coverExpiryTimersRef = useRef<Record<string, number>>({});

  const clearClimatePending = useCallback((entityId: string) => {
    setClimatePendingByEntity((current) => {
      if (!(entityId in current)) return current;
      const next = { ...current };
      delete next[entityId];
      return next;
    });
    clearTimer(climateExpiryTimersRef.current, entityId);
    clearTimer(climateConfirmationTimersRef.current, entityId);
  }, []);

  const scheduleClimateExpiry = useCallback((entityId: string) => {
    clearTimer(climateExpiryTimersRef.current, entityId);
    climateExpiryTimersRef.current[entityId] = window.setTimeout(
      () => clearClimatePending(entityId),
      CLIMATE_PENDING_TTL_MS,
    );
  }, [clearClimatePending]);

  const upsertClimatePending = useCallback((
    entityId: string,
    patch: Partial<ClimateQueuedCommand>,
  ) => {
    setClimatePendingByEntity((current) => {
      const nextEntry: ClimatePendingState = {
        ...(current[entityId] ?? { expiresAt: Date.now() + CLIMATE_PENDING_TTL_MS }),
        ...patch,
        expiresAt: Date.now() + CLIMATE_PENDING_TTL_MS,
      };
      if (hasClimatePendingValues(nextEntry)) {
        return { ...current, [entityId]: nextEntry };
      }
      if (!(entityId in current)) return current;
      const next = { ...current };
      delete next[entityId];
      return next;
    });
    scheduleClimateExpiry(entityId);
  }, [scheduleClimateExpiry]);

  const clearClimatePendingFields = useCallback((
    entityId: string,
    fields: Array<keyof ClimateQueuedCommand>,
  ) => {
    setClimatePendingByEntity((current) => {
      const existing = current[entityId];
      if (!existing) return current;
      const nextEntry = { ...existing };
      fields.forEach((field) => {
        (nextEntry as Record<string, unknown>)[field] = undefined;
      });
      if (hasClimatePendingValues(nextEntry)) {
        return { ...current, [entityId]: nextEntry };
      }
      const next = { ...current };
      delete next[entityId];
      clearTimer(climateExpiryTimersRef.current, entityId);
      clearTimer(climateConfirmationTimersRef.current, entityId);
      return next;
    });
  }, []);

  const clearCoverPending = useCallback((entityId: string) => {
    setCoverPendingByEntity((current) => {
      if (!(entityId in current)) return current;
      const next = { ...current };
      delete next[entityId];
      return next;
    });
    clearTimer(coverExpiryTimersRef.current, entityId);
  }, []);

  const scheduleCoverExpiry = useCallback((entityId: string) => {
    clearTimer(coverExpiryTimersRef.current, entityId);
    coverExpiryTimersRef.current[entityId] = window.setTimeout(
      () => clearCoverPending(entityId),
      COVER_PENDING_TTL_MS,
    );
  }, [clearCoverPending]);

  const upsertCoverPending = useCallback((
    entityId: string,
    patch: Partial<Omit<CoverPendingState, 'expiresAt'>>,
  ) => {
    setCoverPendingByEntity((current) => {
      const nextEntry: CoverPendingState = {
        ...(current[entityId] ?? { expiresAt: Date.now() + COVER_PENDING_TTL_MS }),
        ...patch,
        expiresAt: Date.now() + COVER_PENDING_TTL_MS,
      };
      if (hasCoverPendingValues(nextEntry)) {
        return { ...current, [entityId]: nextEntry };
      }
      if (!(entityId in current)) return current;
      const next = { ...current };
      delete next[entityId];
      return next;
    });
    scheduleCoverExpiry(entityId);
  }, [scheduleCoverExpiry]);

  const clearCoverPendingFields = useCallback((
    entityId: string,
    fields: Array<'state' | 'position' | 'tiltPosition'>,
  ) => {
    setCoverPendingByEntity((current) => {
      const existing = current[entityId];
      if (!existing) return current;
      const nextEntry = { ...existing };
      fields.forEach((field) => {
        (nextEntry as Record<string, unknown>)[field] = undefined;
      });
      if (hasCoverPendingValues(nextEntry)) {
        return { ...current, [entityId]: nextEntry };
      }
      const next = { ...current };
      delete next[entityId];
      clearTimer(coverExpiryTimersRef.current, entityId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isHaConnected) return;
    const resolved = Object.entries(climatePendingByEntity)
      .filter(([entityId, pending]) => {
        if (!hasClimatePendingValues(pending)) return true;
        const entity = haStates[entityId];
        if (!entity) return false;
        const attributes = entity.rawAttributes;
        const checks = [
          !Number.isFinite(pending.targetTemp) ||
            almostEqual(
              toFiniteNumber(entity.targetValue) ?? toFiniteNumber(attributes?.temperature),
              pending.targetTemp,
            ),
          !Number.isFinite(pending.targetTempLow) ||
            almostEqual(
              toFiniteNumber(entity.targetTempLow) ?? toFiniteNumber(attributes?.target_temp_low),
              pending.targetTempLow,
            ),
          !Number.isFinite(pending.targetTempHigh) ||
            almostEqual(
              toFiniteNumber(entity.targetTempHigh) ?? toFiniteNumber(attributes?.target_temp_high),
              pending.targetTempHigh,
            ),
          !normalizeLower(pending.fanMode) ||
            normalizeLower(pending.fanMode) ===
              normalizeLower(toTrimmedString(entity.fanMode) ?? toTrimmedString(attributes?.fan_mode)),
          !Number.isFinite(pending.targetHumidity) ||
            almostEqual(
              toFiniteNumber(entity.targetHumidity) ?? toFiniteNumber(attributes?.humidity),
              pending.targetHumidity,
              0.5,
            ),
          !normalizeLower(pending.presetMode) ||
            normalizeLower(pending.presetMode) ===
              normalizeLower(toTrimmedString(entity.presetMode) ?? toTrimmedString(attributes?.preset_mode)),
          !normalizeLower(pending.swingMode) ||
            normalizeLower(pending.swingMode) ===
              normalizeLower(toTrimmedString(entity.swingMode) ?? toTrimmedString(attributes?.swing_mode)),
          !normalizeLower(pending.swingHorizontalMode) ||
            normalizeLower(pending.swingHorizontalMode) ===
              normalizeLower(
                toTrimmedString(entity.swingHorizontalMode) ??
                  toTrimmedString(attributes?.swing_horizontal_mode),
              ),
        ];
        return checks.every(Boolean);
      })
      .map(([entityId]) => entityId);
    const resolvedSet = new Set(resolved);
    Object.entries(climateConfirmationTimersRef.current).forEach(([entityId, timeoutId]) => {
      if (!resolvedSet.has(entityId)) {
        window.clearTimeout(timeoutId);
        delete climateConfirmationTimersRef.current[entityId];
      }
    });
    resolved.forEach((entityId) => {
      if (climateConfirmationTimersRef.current[entityId] !== undefined) return;
      climateConfirmationTimersRef.current[entityId] = window.setTimeout(
        () => clearClimatePending(entityId),
        CLIMATE_PENDING_CONFIRMATION_HOLD_MS,
      );
    });
  }, [clearClimatePending, climatePendingByEntity, haStates, isHaConnected]);

  useEffect(() => {
    if (!isHaConnected) return;
    Object.entries(coverPendingByEntity).forEach(([entityId, pending]) => {
      if (!hasCoverPendingValues(pending)) {
        clearCoverPending(entityId);
        return;
      }
      const entity = haStates[entityId];
      if (!entity) return;
      const attributes = entity.rawAttributes;
      const liveState = normalizeCoverState(
        toTrimmedString(entity.state) ?? toTrimmedString(entity.stateLabel),
      );
      const livePosition = resolveCoverPosition(
        liveState,
        resolveCoverPositionAttribute(attributes),
        pending.position ?? 70,
      );
      const liveTiltPosition = resolveCoverTiltPosition(
        resolveCoverTiltAttribute(attributes),
        pending.tiltPosition ?? 50,
      );
      const pendingState = normalizeCoverState(pending.state);
      const stateReady =
        !pendingState ||
        pendingState === 'unknown' ||
        (pendingState === 'opening' && liveState === 'open') ||
        (pendingState === 'closing' && liveState === 'closed') ||
        pendingState === liveState;
      if (
        stateReady &&
        (!Number.isFinite(pending.position) || almostEqual(livePosition, pending.position, 1)) &&
        (!Number.isFinite(pending.tiltPosition) ||
          almostEqual(liveTiltPosition, pending.tiltPosition, 1))
      ) {
        clearCoverPending(entityId);
      }
    });
  }, [clearCoverPending, coverPendingByEntity, haStates, isHaConnected]);

  const clearAll = useCallback(() => {
    clearRegistry(climateExpiryTimersRef.current);
    clearRegistry(climateConfirmationTimersRef.current);
    clearRegistry(coverExpiryTimersRef.current);
    setClimatePendingByEntity({});
    setCoverPendingByEntity({});
  }, []);

  useEffect(() => {
    if (!isHaConnected) clearAll();
  }, [clearAll, isHaConnected]);

  useEffect(
    () => () => {
      clearRegistry(climateExpiryTimersRef.current);
      clearRegistry(climateConfirmationTimersRef.current);
      clearRegistry(coverExpiryTimersRef.current);
    },
    [],
  );

  return {
    climatePendingByEntity,
    coverPendingByEntity,
    upsertClimatePending,
    clearClimatePendingFields,
    upsertCoverPending,
    clearCoverPendingFields,
  };
}
