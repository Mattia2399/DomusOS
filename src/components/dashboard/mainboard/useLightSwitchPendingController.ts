import { useCallback, useEffect, useRef, useState } from 'react';
import type { MockEntityStateMap } from '../../../types/ha';

export const LIGHT_TOGGLE_PENDING_TTL_MS = 5000;
export const LIGHT_BRIGHTNESS_PENDING_TTL_MS = 6000;
export const LIGHT_COLOR_PENDING_TTL_MS = 2500;
export const SWITCH_TOGGLE_PENDING_TTL_MS = 5000;

export type LightColorPendingState = {
  hsColor: [number, number];
  expiresAt: number;
};

export type LightTogglePendingState = {
  targetOn: boolean;
  expiresAt: number;
};

export type LightBrightnessPendingState = {
  brightness: number;
  expiresAt: number;
};

export type SwitchTogglePendingState = {
  targetOn: boolean;
  expiresAt: number;
};

function almostEqual(value: number | undefined, expected: number | undefined, tolerance = 0.15) {
  return (
    Number.isFinite(value) &&
    Number.isFinite(expected) &&
    Math.abs((value as number) - (expected as number)) <= tolerance
  );
}

function clearTimer(registry: Record<string, number>, entityId: string) {
  const timeoutId = registry[entityId];
  if (timeoutId === undefined) {
    return;
  }
  window.clearTimeout(timeoutId);
  delete registry[entityId];
}

function clearTimerRegistry(registry: Record<string, number>) {
  Object.values(registry).forEach((timeoutId) => window.clearTimeout(timeoutId));
  Object.keys(registry).forEach((entityId) => delete registry[entityId]);
}

function removeEntries<T>(
  setter: React.Dispatch<React.SetStateAction<Record<string, T>>>,
  entityIds: string[],
) {
  if (entityIds.length === 0) {
    return;
  }
  setter((current) => {
    const next = { ...current };
    let changed = false;
    entityIds.forEach((entityId) => {
      if (entityId in next) {
        delete next[entityId];
        changed = true;
      }
    });
    return changed ? next : current;
  });
}

export function useLightSwitchPendingController({
  haStates,
  isHaConnected,
}: {
  haStates: MockEntityStateMap;
  isHaConnected: boolean;
}) {
  const [lightTogglePendingByEntity, setLightTogglePendingByEntity] = useState<
    Record<string, LightTogglePendingState>
  >({});
  const [lightBrightnessPendingByEntity, setLightBrightnessPendingByEntity] = useState<
    Record<string, LightBrightnessPendingState>
  >({});
  const [lightColorPendingByEntity, setLightColorPendingByEntity] = useState<
    Record<string, LightColorPendingState>
  >({});
  const [switchTogglePendingByEntity, setSwitchTogglePendingByEntity] = useState<
    Record<string, SwitchTogglePendingState>
  >({});

  const lightToggleTimersRef = useRef<Record<string, number>>({});
  const lightBrightnessTimersRef = useRef<Record<string, number>>({});
  const lightColorTimersRef = useRef<Record<string, number>>({});
  const switchToggleTimersRef = useRef<Record<string, number>>({});

  const setPendingWithExpiry = useCallback(
    <T,>(
      entityId: string,
      entry: T,
      ttlMs: number,
      timers: Record<string, number>,
      setter: React.Dispatch<React.SetStateAction<Record<string, T>>>,
    ) => {
      clearTimer(timers, entityId);
      setter((current) => ({ ...current, [entityId]: entry }));
      timers[entityId] = window.setTimeout(() => {
        removeEntries(setter, [entityId]);
        delete timers[entityId];
      }, ttlMs);
    },
    [],
  );

  const clearLightTogglePending = useCallback((entityId: string) => {
    removeEntries(setLightTogglePendingByEntity, [entityId]);
    clearTimer(lightToggleTimersRef.current, entityId);
  }, []);

  const clearLightBrightnessPending = useCallback((entityId: string) => {
    removeEntries(setLightBrightnessPendingByEntity, [entityId]);
    clearTimer(lightBrightnessTimersRef.current, entityId);
  }, []);

  const clearLightColorPending = useCallback((entityId: string) => {
    removeEntries(setLightColorPendingByEntity, [entityId]);
    clearTimer(lightColorTimersRef.current, entityId);
  }, []);

  const clearSwitchTogglePending = useCallback((entityId: string) => {
    removeEntries(setSwitchTogglePendingByEntity, [entityId]);
    clearTimer(switchToggleTimersRef.current, entityId);
  }, []);

  const setLightTogglePending = useCallback(
    (entityId: string, targetOn: boolean) => {
      setPendingWithExpiry(
        entityId,
        { targetOn, expiresAt: Date.now() + LIGHT_TOGGLE_PENDING_TTL_MS },
        LIGHT_TOGGLE_PENDING_TTL_MS,
        lightToggleTimersRef.current,
        setLightTogglePendingByEntity,
      );
    },
    [setPendingWithExpiry],
  );

  const setLightPowerPendingIfChanged = useCallback(
    (entityId: string, targetOn: boolean) => {
      const liveEntity = haStates[entityId];
      const currentOn =
        typeof liveEntity?.toggleOn === 'boolean'
          ? liveEntity.toggleOn
          : (liveEntity?.state ?? '').trim().toLowerCase() === 'on';
      if (currentOn !== targetOn) {
        setLightTogglePending(entityId, targetOn);
      }
    },
    [haStates, setLightTogglePending],
  );

  const setLightBrightnessPending = useCallback(
    (entityId: string, brightness: number) => {
      const safeBrightness = Math.min(100, Math.max(0, Math.round(brightness)));
      setPendingWithExpiry(
        entityId,
        { brightness: safeBrightness, expiresAt: Date.now() + LIGHT_BRIGHTNESS_PENDING_TTL_MS },
        LIGHT_BRIGHTNESS_PENDING_TTL_MS,
        lightBrightnessTimersRef.current,
        setLightBrightnessPendingByEntity,
      );
    },
    [setPendingWithExpiry],
  );

  const setLightColorPending = useCallback(
    (entityId: string, hsColor: [number, number]) => {
      setPendingWithExpiry(
        entityId,
        { hsColor, expiresAt: Date.now() + LIGHT_COLOR_PENDING_TTL_MS },
        LIGHT_COLOR_PENDING_TTL_MS,
        lightColorTimersRef.current,
        setLightColorPendingByEntity,
      );
    },
    [setPendingWithExpiry],
  );

  const setSwitchTogglePending = useCallback(
    (entityId: string, targetOn: boolean) => {
      setPendingWithExpiry(
        entityId,
        { targetOn, expiresAt: Date.now() + SWITCH_TOGGLE_PENDING_TTL_MS },
        SWITCH_TOGGLE_PENDING_TTL_MS,
        switchToggleTimersRef.current,
        setSwitchTogglePendingByEntity,
      );
    },
    [setPendingWithExpiry],
  );

  const clearLightCommandPending = useCallback(
    (
      entityId: string,
      options: { brightness?: boolean; color?: boolean; toggle?: boolean } = {},
    ) => {
      if (options.brightness) clearLightBrightnessPending(entityId);
      if (options.color) clearLightColorPending(entityId);
      if (options.toggle) clearLightTogglePending(entityId);
    },
    [clearLightBrightnessPending, clearLightColorPending, clearLightTogglePending],
  );

  useEffect(() => {
    if (!isHaConnected) return;
    Object.entries(lightTogglePendingByEntity).forEach(([entityId, pending]) => {
      const entity = haStates[entityId];
      if (!entity) return;
      const liveIsOn =
        typeof entity.toggleOn === 'boolean'
          ? entity.toggleOn
          : (entity.state ?? '').trim().toLowerCase() === 'on';
      if (liveIsOn === pending.targetOn) clearLightTogglePending(entityId);
    });
  }, [clearLightTogglePending, haStates, isHaConnected, lightTogglePendingByEntity]);

  useEffect(() => {
    if (!isHaConnected) return;
    Object.entries(switchTogglePendingByEntity).forEach(([entityId, pending]) => {
      const entity = haStates[entityId];
      if (!entity) return;
      const liveIsOn =
        typeof entity.toggleOn === 'boolean'
          ? entity.toggleOn
          : (entity.state ?? '').trim().toLowerCase() === 'on';
      if (liveIsOn === pending.targetOn) clearSwitchTogglePending(entityId);
    });
  }, [clearSwitchTogglePending, haStates, isHaConnected, switchTogglePendingByEntity]);

  useEffect(() => {
    if (!isHaConnected) return;
    Object.entries(lightBrightnessPendingByEntity).forEach(([entityId, pending]) => {
      const entity = haStates[entityId];
      if (!entity) return;
      const liveBrightness =
        typeof entity.brightness === 'number'
          ? entity.brightness
          : typeof entity.numericValue === 'number'
            ? entity.numericValue
            : undefined;
      if (almostEqual(liveBrightness, pending.brightness, 1)) {
        clearLightBrightnessPending(entityId);
      }
    });
  }, [clearLightBrightnessPending, haStates, isHaConnected, lightBrightnessPendingByEntity]);

  useEffect(() => {
    if (!isHaConnected) return;
    Object.entries(lightColorPendingByEntity).forEach(([entityId, pending]) => {
      const entity = haStates[entityId];
      const liveHsColor = entity?.hsColor ?? entity?.hs_color;
      if (
        liveHsColor &&
        almostEqual(liveHsColor[0], pending.hsColor[0], 1.2) &&
        almostEqual(liveHsColor[1], pending.hsColor[1], 1.2)
      ) {
        clearLightColorPending(entityId);
      }
    });
  }, [clearLightColorPending, haStates, isHaConnected, lightColorPendingByEntity]);

  const clearAll = useCallback(() => {
    clearTimerRegistry(lightToggleTimersRef.current);
    clearTimerRegistry(lightBrightnessTimersRef.current);
    clearTimerRegistry(lightColorTimersRef.current);
    clearTimerRegistry(switchToggleTimersRef.current);
    setLightTogglePendingByEntity({});
    setLightBrightnessPendingByEntity({});
    setLightColorPendingByEntity({});
    setSwitchTogglePendingByEntity({});
  }, []);

  useEffect(() => {
    if (!isHaConnected) clearAll();
  }, [clearAll, isHaConnected]);

  useEffect(
    () => () => {
      clearTimerRegistry(lightToggleTimersRef.current);
      clearTimerRegistry(lightBrightnessTimersRef.current);
      clearTimerRegistry(lightColorTimersRef.current);
      clearTimerRegistry(switchToggleTimersRef.current);
    },
    [],
  );

  return {
    lightTogglePendingByEntity,
    lightBrightnessPendingByEntity,
    lightColorPendingByEntity,
    switchTogglePendingByEntity,
    setLightTogglePending,
    setLightPowerPendingIfChanged,
    setLightBrightnessPending,
    setLightColorPending,
    setSwitchTogglePending,
    clearLightTogglePending,
    clearLightBrightnessPending,
    clearLightColorPending,
    clearSwitchTogglePending,
    clearLightCommandPending,
  };
}
