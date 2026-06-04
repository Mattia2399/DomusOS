import React from 'react';
import { ClimateCard } from './ClimateCard';
import { LightCard } from './LightCard';
import { CameraCard } from './CameraCard';
import { SensorCard } from './SensorCard';
import { MediaCard } from './MediaCard';
import { AlarmCard } from './AlarmCard';
import { VacuumCard } from './VacuumCard';
import { LockCard } from './LockCard';
import { CoverCard } from './CoverCard';
import { MembersCard } from './MembersCard';
import { GreetingCard } from './GreetingCard';
import { GreetingWeatherCard } from './GreetingWeatherCard';
import { WeatherCard } from './WeatherCard';
import { ScenesCard, SCENES_CATALOG } from './ScenesCard';
import { resolveCardVariant } from './cardVariant';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import { ROOT_CANVAS_ROW_UNITS, type DashboardSection, type SceneKey, type Widget } from '../../types/dashboardModels';
import type { GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import type { MockEntityState } from '../../types/ha';

type HouseMemberCardItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
  isCurrent?: boolean;
};

type WidgetCardRendererProps = {
  widget: Widget;
  dashboardState: DashboardStateShape;
  isEditMode: boolean;
  isSelected: boolean;
  value: number;
  sensorHistory?: number[];
  sensorBatteryEntity?: MockEntityState;
  onClick: () => void;
  onLightBrightnessChange?: (widget: Widget, value: number) => void;
  onClimateTargetTempChange?: (widget: Widget, value: number) => void;
  onClimateTargetRangeChange?: (widget: Widget, low: number, high: number) => void;
  onClimateModeChange?: (widget: Widget, mode: string) => void;
  onClimateFanModeChange?: (widget: Widget, mode: string) => void;
  onMediaToggle?: (widget: Widget) => void;
  onMediaPrevious?: (widget: Widget) => void;
  onMediaNext?: (widget: Widget) => void;
  onMediaSeek?: (widget: Widget, position: number) => void;
  onAlarmDisarm?: (widget: Widget) => void;
  onAlarmArm?: (widget: Widget, mode: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass') => void;
  onVacuumStartPause?: (widget: Widget) => void;
  onVacuumReturnToBase?: (widget: Widget) => void;
  onLockToggle?: (widget: Widget) => boolean | void;
  onLockOpen?: (widget: Widget) => void;
  onMembersOpenPanel?: (widget: Widget) => void;
  liveEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
  houseMembers?: HouseMemberCardItem[];
};

function WidgetCardRendererComponent({
  widget,
  dashboardState,
  isEditMode,
  isSelected,
  value,
  sensorHistory,
  sensorBatteryEntity,
  onClick,
  onLightBrightnessChange,
  onClimateTargetTempChange,
  onClimateTargetRangeChange,
  onClimateModeChange,
  onClimateFanModeChange,
  onMediaToggle,
  onMediaPrevious,
  onMediaNext,
  onMediaSeek,
  onAlarmDisarm,
  onAlarmArm,
  onVacuumStartPause,
  onVacuumReturnToBase,
  onLockToggle,
  onLockOpen,
  onMembersOpenPanel,
  liveEntity,
  gridBreakpoint,
  houseMembers,
}: WidgetCardRendererProps) {
  const cardVariant = resolveCardVariant(widget);

  if (widget.kind === 'climate') {
    return (
      <ClimateCard
        widget={widget}
        state={dashboardState}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        liveEntity={liveEntity}
        onTemperatureChange={(nextValue) => onClimateTargetTempChange?.(widget, nextValue)}
        onTargetRangeChange={(low, high) => onClimateTargetRangeChange?.(widget, low, high)}
        onModeChange={(mode) => onClimateModeChange?.(widget, mode)}
        onFanModeChange={(mode) => onClimateFanModeChange?.(widget, mode)}
      />
    );
  }

  if (widget.kind === 'light') {
    return (
      <LightCard
        widget={widget}
        state={dashboardState}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        onBrightnessChange={(nextValue) => onLightBrightnessChange?.(widget, nextValue)}
        liveLightState={liveEntity}
      />
    );
  }

  if (widget.kind === 'camera') {
    return (
      <CameraCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        liveEntity={liveEntity}
      />
    );
  }

  if (widget.kind === 'media') {
    return (
      <MediaCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        onTogglePlayback={() => onMediaToggle?.(widget)}
        onPreviousTrack={() => onMediaPrevious?.(widget)}
        onNextTrack={() => onMediaNext?.(widget)}
        onSeek={(position) => onMediaSeek?.(widget, position)}
        liveEntity={liveEntity}
      />
    );
  }

  if (widget.kind === 'alarm') {
    return (
      <AlarmCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        onQuickDisarm={() => onAlarmDisarm?.(widget)}
        onQuickArm={(mode) => onAlarmArm?.(widget, mode)}
        liveEntity={liveEntity}
      />
    );
  }

  if (widget.kind === 'vacuum') {
    return (
      <VacuumCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        onStartPause={() => onVacuumStartPause?.(widget)}
        onReturnToBase={() => onVacuumReturnToBase?.(widget)}
        liveEntity={liveEntity}
      />
    );
  }

  if (widget.kind === 'lock') {
    return (
      <LockCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        onToggleLock={() => onLockToggle?.(widget)}
        onOpenDoor={() => onLockOpen?.(widget)}
        liveEntity={liveEntity}
        gridBreakpoint={gridBreakpoint}
        variant={cardVariant}
      />
    );
  }

  if (widget.kind === 'cover') {
    return (
      <CoverCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        liveEntity={liveEntity}
      />
    );
  }

  if (widget.kind === 'members') {
    return (
      <MembersCard
        widget={widget}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onClick={onClick}
        onOpenMembersPanel={() => onMembersOpenPanel?.(widget)}
        houseMembers={houseMembers}
        gridBreakpoint={gridBreakpoint}
      />
    );
  }

  return (
    <SensorCard
      widget={widget}
      isSelected={isSelected}
      value={value}
      sensorHistory={sensorHistory}
      batteryEntity={sensorBatteryEntity}
      isEditMode={isEditMode}
      onClick={onClick}
      liveEntity={liveEntity}
      gridBreakpoint={gridBreakpoint}
      variant={cardVariant}
    />
  );
}

function areWidgetEntitiesEqual(prevEntity: MockEntityState | undefined, nextEntity: MockEntityState | undefined) {
  if (prevEntity === nextEntity) {
    return true;
  }
  if (!prevEntity || !nextEntity) {
    return !prevEntity && !nextEntity;
  }
  return (
    prevEntity.state === nextEntity.state &&
    prevEntity.stateLabel === nextEntity.stateLabel &&
    prevEntity.secondary === nextEntity.secondary &&
    prevEntity.numericValue === nextEntity.numericValue &&
    prevEntity.targetValue === nextEntity.targetValue &&
    prevEntity.currentValue === nextEntity.currentValue &&
    prevEntity.brightness === nextEntity.brightness &&
    prevEntity.toggleOn === nextEntity.toggleOn &&
    prevEntity.progress === nextEntity.progress &&
    prevEntity.mediaPosition === nextEntity.mediaPosition &&
    prevEntity.mediaPositionUpdatedAt === nextEntity.mediaPositionUpdatedAt &&
    prevEntity.volumeLevel === nextEntity.volumeLevel &&
    prevEntity.mediaMuted === nextEntity.mediaMuted &&
    prevEntity.hvacMode === nextEntity.hvacMode &&
    prevEntity.fanMode === nextEntity.fanMode &&
    prevEntity.rawAttributes === nextEntity.rawAttributes
  );
}

function areWidgetCardRendererPropsEqual(prevProps: WidgetCardRendererProps, nextProps: WidgetCardRendererProps) {
  if (prevProps.widget !== nextProps.widget) {
    return false;
  }
  if (prevProps.isEditMode !== nextProps.isEditMode) {
    return false;
  }
  if (prevProps.isSelected !== nextProps.isSelected) {
    return false;
  }
  if (prevProps.gridBreakpoint !== nextProps.gridBreakpoint) {
    return false;
  }
  if (!areWidgetEntitiesEqual(prevProps.liveEntity, nextProps.liveEntity)) {
    return false;
  }

  const kind = nextProps.widget.kind;
  if ((kind === 'climate' || kind === 'light') && prevProps.dashboardState !== nextProps.dashboardState) {
    return false;
  }
  if (kind === 'sensor') {
    if (!areWidgetEntitiesEqual(prevProps.sensorBatteryEntity, nextProps.sensorBatteryEntity)) {
      return false;
    }
    if (prevProps.value !== nextProps.value) {
      return false;
    }
    if (prevProps.sensorHistory !== nextProps.sensorHistory) {
      return false;
    }
  }
  if (kind === 'members' && prevProps.houseMembers !== nextProps.houseMembers) {
    return false;
  }

  return true;
}

export const WidgetCardRenderer = React.memo(
  WidgetCardRendererComponent,
  areWidgetCardRendererPropsEqual,
);

type SectionCardRendererProps = {
  section: DashboardSection;
  state: DashboardStateShape;
  compact?: boolean;
  isEditMode?: boolean;
  onWeatherClick?: () => void;
  runningSceneId?: SceneKey | null;
  runningSceneStartedAt?: number | null;
  onAddScene?: (sceneId: SceneKey) => void;
  onSceneTrigger?: (sceneId: SceneKey) => void;
};

export function SectionCardRenderer({
  section,
  state,
  compact = false,
  isEditMode = false,
  onWeatherClick,
  runningSceneId,
  runningSceneStartedAt,
  onAddScene,
  onSceneTrigger,
}: SectionCardRendererProps) {
  if (section.kind === 'greeting') {
    const showWeather = section.showWeather ?? false;
    if (showWeather) {
      return (
        <GreetingWeatherCard
          state={state}
          title={section.title}
          subtitle={section.subtitle}
          titleAuto={section.titleAuto}
          subtitleAuto={section.subtitleAuto}
          compact={compact}
          isEditMode={isEditMode}
          onWeatherClick={onWeatherClick}
          weatherLayout={section.weatherLayout}
          weatherUnit={section.weatherUnit}
          weatherForecastType={section.weatherForecastType}
          weatherForecastDays={section.weatherForecastDays}
          weatherForecastDensity={section.weatherForecastDensity}
          weatherSecondaryInfo={section.weatherSecondaryInfo}
          weatherShowCondition={section.weatherShowCondition}
          weatherShowPrecipitation={section.weatherShowPrecipitation}
          weatherShowWind={section.weatherShowWind}
          weatherConditionOverride={section.weatherCondition}
        />
      );
    }
    return (
      <GreetingCard
        state={state}
        title={section.title}
        subtitle={section.subtitle}
        titleAuto={section.titleAuto}
        subtitleAuto={section.subtitleAuto}
        compact={compact}
      />
    );
  }

  if (section.kind === 'weather') {
    const compactHint = section.layout.h <= ROOT_CANVAS_ROW_UNITS || section.layout.w <= 2;
    const denseHint = compact || section.layout.h <= ROOT_CANVAS_ROW_UNITS * 2 || section.layout.w <= 3;
    return (
      <WeatherCard
        weather={state.weather}
        compactHint={compactHint}
        denseHint={denseHint}
        layout={section.weatherLayout}
        unit={section.weatherUnit}
        forecastType={section.weatherForecastType}
        forecastDays={section.weatherForecastDays}
        forecastDensity={section.weatherForecastDensity}
        secondaryInfo={section.weatherSecondaryInfo}
      />
    );
  }

  return (
    <ScenesCard
      title={section.title ?? 'Scenes'}
      scenes={section.scenes ?? SCENES_CATALOG.slice(0, 4).map((scene) => scene.id)}
      sceneLabels={section.sceneLabels}
      sceneIcons={section.sceneIcons}
      compact={compact}
      isEditMode={isEditMode}
      runningSceneId={runningSceneId}
      runningSceneStartedAt={runningSceneStartedAt}
      onAddScene={onAddScene}
      onSceneTrigger={onSceneTrigger}
    />
  );
}
