import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { ActiveDevice } from './types';
import { ClimateControls } from './ClimateControls';
import { LightControls } from './LightControls';
import { CameraControls, type CameraPtzDirection } from './CameraControls';
import { MediaControls } from './MediaControls';
import { SensorControls } from './SensorControls';
import { WeatherControls } from './WeatherControls';
import { AlarmControls } from './AlarmControls';
import { VacuumControls } from './VacuumControls';
import { LockControls } from './LockControls';
import { CoverControls } from './CoverControls';
import type { DashboardStateShape } from '../../hooks/useDashboardState';

interface ContextSidebarProps {
  activeDevice: ActiveDevice | null;
  onClose?: () => void;
  showCloseButton?: boolean;
  externalScrollContainer?: boolean;
  lamp: {
    name: string;
    isOn: boolean;
    brightness: number;
    status: string;
    hsColor: [number, number];
    colorTemp: number;
    supportsBrightness?: boolean;
    supportsColorTemp?: boolean;
    supportsColor?: boolean;
  };
  climate: {
    name: string;
    mode: string;
    isOn: boolean;
    status?: string;
    currentTemp: number;
    targetTemp: number;
    minTemp: number;
    maxTemp: number;
    targetTempLow?: number;
    targetTempHigh?: number;
    targetTempStep?: number;
    hvacModes?: string[];
    hvacAction?: string;
    fanMode?: string;
    fanModes?: string[];
    temperatureUnit?: string;
    rawAttributes?: Record<string, unknown>;
  };
  camera: {
    name: string;
    status?: string;
    entityId?: string;
    streamUrl?: string;
    snapshotUrl?: string;
    isOffline?: boolean;
    supportsPtz?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  speaker: {
    isPlaying: boolean;
    status: string;
    progress: number;
    positionSeconds?: number;
    trackTitle?: string;
    trackArtist?: string;
    durationSeconds?: number;
    coverUrl?: string;
    volumeLevel?: number;
    muted?: boolean;
    supportsSeek?: boolean;
    supportsVolume?: boolean;
    supportsMute?: boolean;
    supportsNextTrack?: boolean;
    supportsPreviousTrack?: boolean;
    supportsPower?: boolean;
  };
  vacuum: {
    name: string;
    state: string;
    status?: string;
    batteryLevel?: number;
    cleanedArea?: number;
    cleanedAreaUnit?: string;
    cleaningMinutes?: number;
    fanSpeed?: string;
    fanSpeedList?: string[];
    mapUrl?: string;
    supportedFeatures?: number;
    supportsStart?: boolean;
    supportsPause?: boolean;
    supportsStop?: boolean;
    supportsReturnToBase?: boolean;
    supportsLocate?: boolean;
    supportsCleanSpot?: boolean;
    supportsCleanArea?: boolean;
    supportsFanSpeed?: boolean;
    supportsMap?: boolean;
    supportsSendCommand?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  vacuumAreas?: Array<{
    id: string;
    name: string;
  }>;
  weather: DashboardStateShape['weather'];
  alarm: {
    name: string;
    state: string;
    status?: string;
    codeArmRequired?: boolean;
    unlockCode?: string;
    changedBy?: string;
    activityLogLimit?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
    supportedFeatures?: number;
    rawAttributes?: Record<string, unknown>;
  };
  lock: {
    name: string;
    state: string;
    status?: string;
    changedBy?: string;
    activityLogLimit?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
    supportedFeatures?: number;
    rawAttributes?: Record<string, unknown>;
    lockCode?: string;
  };
  cover: {
    name: string;
    state: string;
    status?: string;
    position?: number;
    tiltPosition?: number;
    supportedFeatures?: number;
    supportsOpen?: boolean;
    supportsClose?: boolean;
    supportsStop?: boolean;
    supportsSetPosition?: boolean;
    supportsSetTiltPosition?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  weatherConfig?: {
    unit?: 'C' | 'F';
    forecastType?: 'daily' | 'hourly' | 'twice_daily';
    forecastDays?: number;
    forecastDensity?: 'comfortable' | 'compact';
    conditionOverride?: string;
    showPrecipitation?: boolean;
    showWind?: boolean;
  };
  actions: {
    toggleLamp: () => void;
    setLampBrightness: (value: number) => void;
    setLampColorTemp: (kelvin: number) => void;
    setLampHsColor: (hs: [number, number]) => void;
    toggleClimatePower: () => void;
    decreaseClimateTarget: () => void;
    increaseClimateTarget: () => void;
    autoAdjustClimate: () => void;
    nudgeClimateCurrent: () => void;
    setClimateTargetTemp?: (value: number) => void;
    setClimateTargetRange?: (low: number, high: number) => void;
    setClimateMode?: (mode: string) => void;
    setClimateFanMode?: (mode: string) => void;
    toggleSpeakerPlayback: () => void;
    toggleSpeakerPower: () => void;
    previousSpeakerTrack: () => void;
    nextSpeakerTrack: () => void;
    seekSpeakerPosition: (position: number) => void;
    setSpeakerVolume: (value: number) => void;
    toggleSpeakerMute: () => void;
    disarmAlarm: (code?: string) => void;
    armAlarmHome: (code?: string) => void;
    armAlarmAway: (code?: string) => void;
    armAlarmNight: (code?: string) => void;
    armAlarmVacation: (code?: string) => void;
    armAlarmCustomBypass: (code?: string) => void;
    triggerAlarm: (code?: string) => void;
    startVacuum: () => void;
    pauseVacuum: () => void;
    stopVacuum: () => void;
    returnVacuumToBase: () => void;
    locateVacuum: () => void;
    cleanVacuumSpot: () => void;
    cleanVacuumArea: (areaIds: string[]) => void;
    setVacuumFanSpeed: (fanSpeed: string) => void;
    sendVacuumCommand: (command: string, params?: unknown) => void;
    lockDoor: (code?: string) => void;
    unlockDoor: (code?: string) => void;
    openDoor: (code?: string) => void;
    openCover: () => void;
    closeCover: () => void;
    stopCover: () => void;
    setCoverPosition?: (position: number) => void;
    setCoverTiltPosition?: (position: number) => void;
    moveCameraPtz?: (direction: CameraPtzDirection) => void;
    stopCameraPtz?: () => void;
  };
}

export function ContextSidebar({
  activeDevice,
  onClose,
  showCloseButton = true,
  externalScrollContainer = false,
  lamp,
  climate,
  camera,
  speaker,
  vacuum,
  vacuumAreas,
  weather,
  alarm,
  lock,
  cover,
  weatherConfig,
  actions,
}: ContextSidebarProps) {
  const activeDeviceLayoutClass = externalScrollContainer
    ? 'overflow-visible pb-3 pt-2'
    : 'overflow-y-auto overscroll-contain custom-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] pb-4 lg:pb-6 pt-10 lg:pt-12';
  return (
    <aside
      className={`context-sidebar w-full shrink-0 relative ${
        externalScrollContainer ? 'h-auto' : 'h-full min-h-0'
      } ${
        activeDevice ? activeDeviceLayoutClass : 'overflow-hidden'
      }`}
    >
      {activeDevice && onClose && showCloseButton ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/85 backdrop-blur-xl transition-all hover:bg-white/15 hover:text-white active:scale-95"
          aria-label="Chiudi pannello contestuale"
          title="Chiudi"
        >
          <X size={16} />
        </button>
      ) : null}

      {!activeDevice ? (
        <div className="h-full min-h-0 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/8 flex items-center justify-center p-8 text-center">
          <div>
            <span className="mx-auto w-14 h-14 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-white/85 mb-4">
              <Lightbulb size={22} />
            </span>
            <p className="text-lg font-semibold text-white/95">Nessuna card selezionata</p>
            <p className="text-sm text-white/55 mt-2">Clicca una card per vedere le informazioni</p>
          </div>
        </div>
      ) : null}

      {activeDevice?.type === 'climate' ? (
        <ClimateControls
          climate={climate}
          onTogglePower={actions.toggleClimatePower}
          onDecreaseTarget={actions.decreaseClimateTarget}
          onIncreaseTarget={actions.increaseClimateTarget}
          onAutoAdjust={actions.autoAdjustClimate}
          onRefreshCurrent={actions.nudgeClimateCurrent}
          onSetTargetTemp={actions.setClimateTargetTemp}
          onSetTargetRange={actions.setClimateTargetRange}
          onSetMode={actions.setClimateMode}
          onSetFanMode={actions.setClimateFanMode}
        />
      ) : null}

      {activeDevice?.type === 'light' ? (
        <LightControls
          lamp={lamp}
          onToggle={actions.toggleLamp}
          onBrightnessChange={actions.setLampBrightness}
          onColorTempChange={actions.setLampColorTemp}
          onColorChange={actions.setLampHsColor}
        />
      ) : null}

      {activeDevice?.type === 'camera' ? (
        <CameraControls
          name={camera.name || activeDevice.name}
          status={camera.status ?? activeDevice.status}
          entityId={camera.entityId}
          streamUrl={camera.streamUrl}
          snapshotUrl={camera.snapshotUrl}
          isOffline={camera.isOffline}
          supportsPtz={camera.supportsPtz}
          onPtzMove={actions.moveCameraPtz}
          onPtzStop={actions.stopCameraPtz}
          rawAttributes={camera.rawAttributes}
        />
      ) : null}

      {activeDevice?.type === 'media' ? (
        <MediaControls
          name={activeDevice.name}
          status={activeDevice.status}
          isPlaying={speaker.isPlaying}
          progress={speaker.progress}
          positionSeconds={speaker.positionSeconds}
          trackTitle={speaker.trackTitle}
          trackArtist={speaker.trackArtist}
          durationSeconds={speaker.durationSeconds}
          coverUrl={speaker.coverUrl}
          volumeLevel={speaker.volumeLevel}
          muted={speaker.muted}
          supportsSeek={speaker.supportsSeek}
          supportsVolume={speaker.supportsVolume}
          supportsMute={speaker.supportsMute}
          supportsNextTrack={speaker.supportsNextTrack}
          supportsPreviousTrack={speaker.supportsPreviousTrack}
          supportsPower={speaker.supportsPower}
          onTogglePlayback={actions.toggleSpeakerPlayback}
          onTogglePower={actions.toggleSpeakerPower}
          onPreviousTrack={actions.previousSpeakerTrack}
          onNextTrack={actions.nextSpeakerTrack}
          onSeek={actions.seekSpeakerPosition}
          onVolumeChange={actions.setSpeakerVolume}
          onToggleMute={actions.toggleSpeakerMute}
        />
      ) : null}

      {activeDevice?.type === 'sensor' ? (
        <SensorControls
          name={activeDevice.name}
          status={activeDevice.status}
          value={activeDevice.sensorValue ?? 0}
          unit={activeDevice.sensorUnit ?? '%'}
          history={activeDevice.sensorHistory}
          battery={activeDevice.sensorBattery}
          connection={activeDevice.sensorConnection}
          connectionState={activeDevice.sensorConnectionState}
        />
      ) : null}

      {activeDevice?.type === 'weather' ? (
        <WeatherControls
          weather={weather}
          unit={weatherConfig?.unit}
          forecastType={weatherConfig?.forecastType}
          forecastDays={weatherConfig?.forecastDays}
          forecastDensity={weatherConfig?.forecastDensity}
          conditionOverride={weatherConfig?.conditionOverride}
          showPrecipitation={weatherConfig?.showPrecipitation}
          showWind={weatherConfig?.showWind}
        />
      ) : null}

      {activeDevice?.type === 'alarm' ? (
        <AlarmControls
          alarm={alarm}
          onDisarm={actions.disarmAlarm}
          onArmHome={actions.armAlarmHome}
          onArmAway={actions.armAlarmAway}
          onArmNight={actions.armAlarmNight}
          onArmVacation={actions.armAlarmVacation}
          onArmCustomBypass={actions.armAlarmCustomBypass}
          onTrigger={actions.triggerAlarm}
        />
      ) : null}

      {activeDevice?.type === 'vacuum' ? (
        <VacuumControls
          vacuum={vacuum}
          areaOptions={vacuumAreas}
          onStart={actions.startVacuum}
          onPause={actions.pauseVacuum}
          onStop={actions.stopVacuum}
          onReturnToBase={actions.returnVacuumToBase}
          onLocate={actions.locateVacuum}
          onCleanSpot={actions.cleanVacuumSpot}
          onCleanArea={actions.cleanVacuumArea}
          onSetFanSpeed={actions.setVacuumFanSpeed}
          onSendCommand={actions.sendVacuumCommand}
        />
      ) : null}

      {activeDevice?.type === 'lock' ? (
        <LockControls
          lock={lock}
          onLock={actions.lockDoor}
          onUnlock={actions.unlockDoor}
          onOpen={actions.openDoor}
        />
      ) : null}

      {activeDevice?.type === 'cover' ? (
        <CoverControls
          cover={cover}
          onOpen={actions.openCover}
          onClose={actions.closeCover}
          onStop={actions.stopCover}
          onSetPosition={actions.setCoverPosition}
          onSetTiltPosition={actions.setCoverTiltPosition}
        />
      ) : null}
    </aside>
  );
}
