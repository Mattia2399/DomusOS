import React, { useCallback, useMemo } from 'react';
import { Crown, Lightbulb, LocateFixed, MapPin, Smartphone, Tablet, Users, Watch, X } from 'lucide-react';
import { Map, Marker, type MapProps, type MapRef } from '@vis.gl/react-maplibre';
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
import type { DashboardTheme } from '../../hooks/useProfileSettings';

interface ContextSidebarProps {
  activeDevice: ActiveDevice | null;
  theme?: DashboardTheme;
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

type MembersMapPoint = NonNullable<ActiveDevice['membersMapPoints']>[number];
type MembersMapInitialViewState = NonNullable<MapProps['initialViewState']>;
const MEMBERS_MAP_LIGHT_STYLE_URL = new URL(
  '../../assets/map-styles/members-light.style.json',
  import.meta.url,
).toString();
const MEMBERS_MAP_DARK_STYLE_URL = new URL(
  '../../assets/map-styles/members-dark.style.json',
  import.meta.url,
).toString();

function buildMembersMapInitialViewState(points: MembersMapPoint[]): MembersMapInitialViewState {
  if (points.length === 0) {
    return { longitude: 12.4964, latitude: 41.9028, zoom: 4 };
  }
  if (points.length === 1) {
    return {
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: 12.2,
    };
  }

  let minLongitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;
  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;

  points.forEach((point) => {
    minLongitude = Math.min(minLongitude, point.longitude);
    maxLongitude = Math.max(maxLongitude, point.longitude);
    minLatitude = Math.min(minLatitude, point.latitude);
    maxLatitude = Math.max(maxLatitude, point.latitude);
  });

  const hasArea =
    Math.abs(maxLongitude - minLongitude) > 0.000001 ||
    Math.abs(maxLatitude - minLatitude) > 0.000001;

  if (!hasArea) {
    return {
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: 12.2,
    };
  }

  return {
    bounds: [minLongitude, minLatitude, maxLongitude, maxLatitude],
    fitBoundsOptions: {
      padding: 36,
      maxZoom: 14,
    },
  };
}

export function ContextSidebar({
  activeDevice,
  theme = 'dark',
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
  const membersMapRef = React.useRef<MapRef | null>(null);
  const membersMapPoints = activeDevice?.membersMapPoints ?? [];
  const membersMapStyleUrl =
    theme === 'light' ? MEMBERS_MAP_LIGHT_STYLE_URL : MEMBERS_MAP_DARK_STYLE_URL;
  const currentMemberMapPoint = useMemo(
    () => membersMapPoints.find((point) => point.isCurrent === true) ?? null,
    [membersMapPoints],
  );
  const membersMapInitialViewState = useMemo(
    () => buildMembersMapInitialViewState(membersMapPoints),
    [membersMapPoints],
  );
  const membersMapRenderKey = useMemo(
    () =>
      membersMapPoints.length > 0
        ? membersMapPoints
            .map(
              (point) =>
                `${point.id}:${point.latitude.toFixed(5)}:${point.longitude.toFixed(5)}:${point.isCurrent ? '1' : '0'}`,
            )
            .join('|')
        : 'empty',
    [membersMapPoints],
  );
  const centerMapOnCurrentMember = useCallback(() => {
    if (!currentMemberMapPoint) {
      return;
    }
    const map = membersMapRef.current?.getMap();
    if (!map) {
      return;
    }
    const currentZoom = map.getZoom();
    map.flyTo({
      center: [currentMemberMapPoint.longitude, currentMemberMapPoint.latitude],
      zoom: Number.isFinite(currentZoom) ? Math.max(currentZoom, 12) : 12,
      speed: 0.95,
      essential: true,
    });
  }, [currentMemberMapPoint]);
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

      {activeDevice?.type === 'members' ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-500/15 text-cyan-100">
              <Users size={18} />
            </span>
            <div>
              <p className="text-lg font-semibold text-white/95">{activeDevice.name || 'Members'}</p>
              <p className="text-xs text-white/60">
                {membersMapPoints.length} posizione{membersMapPoints.length === 1 ? '' : 'i'} disponibili
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Mappa Presenze</p>
            <div className="relative mt-2 h-56 overflow-hidden rounded-xl border border-white/12 bg-gradient-to-br from-slate-900/70 to-slate-800/55">
              {membersMapPoints.length > 0 ? (
                <Map
                  ref={membersMapRef}
                  key={`${theme}:${membersMapRenderKey}`}
                  initialViewState={membersMapInitialViewState}
                  mapStyle={membersMapStyleUrl}
                  attributionControl={false}
                  dragRotate={false}
                  touchPitch={false}
                  pitchWithRotate={false}
                  maxPitch={0}
                  minZoom={2}
                  maxZoom={17}
                  style={{ width: '100%', height: '100%' }}
                >
                  {membersMapPoints.map((point) => (
                    <Marker key={point.id} longitude={point.longitude} latitude={point.latitude} anchor="center">
                      <span className="relative flex h-9 w-9 items-center justify-center">
                        {point.avatarUrl ? (
                          <img
                            src={point.avatarUrl}
                            alt={`Profilo ${point.name}`}
                            className="h-9 w-9 rounded-full border-2 border-white/95 bg-slate-200 object-cover shadow-[0_6px_16px_rgba(15,23,42,0.4)]"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/95 bg-slate-300 text-[11px] font-semibold text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.4)]">
                            {(point.name.trim().charAt(0) || '?').toUpperCase()}
                          </span>
                        )}
                        <span className="pointer-events-none absolute -inset-1 rounded-full border border-white/35" />
                        {point.isCurrent ? (
                          <>
                            <span className="pointer-events-none absolute -inset-1.5 rounded-full border border-emerald-300/80" />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
                          </>
                        ) : null}
                      </span>
                    </Marker>
                  ))}
                </Map>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white/65">
                  <MapPin size={18} />
                  <p className="text-xs">Nessuna coordinata disponibile per i membri.</p>
                </div>
              )}
              <button
                type="button"
                onClick={centerMapOnCurrentMember}
                disabled={!currentMemberMapPoint}
                className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 backdrop-blur-xl transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Centra sulla mia posizione"
                title={
                  currentMemberMapPoint
                    ? 'Centra sulla mia posizione'
                    : 'Posizione utente connesso non disponibile'
                }
              >
                <LocateFixed size={15} />
              </button>
            </div>

            {membersMapPoints.length > 0 ? (
              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {membersMapPoints.map((point) => (
                  <div key={point.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="relative shrink-0">
                        {point.avatarUrl ? (
                          <img
                            src={point.avatarUrl}
                            alt={`Profilo ${point.name}`}
                            className="h-9 w-9 rounded-full border border-white/80 object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-slate-300 text-[11px] font-semibold text-slate-700">
                            {(point.name.trim().charAt(0) || '?').toUpperCase()}
                          </span>
                        )}
                        {(point.roleLabel?.trim().toLowerCase() === 'admin' ||
                          point.roleLabel?.trim().toLowerCase() === 'creatore') ? (
                          <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-amber-200/80 bg-amber-400 text-amber-950 shadow-[0_4px_8px_rgba(0,0,0,0.22)]">
                            <Crown size={9} />
                          </span>
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/90">{point.name}</p>
                        <p className="truncate text-[11px] text-white/58">
                          {point.locationLabel?.trim() || 'Posizione sconosciuta'}
                        </p>
                      </div>
                    </div>
                    <div className="flex max-w-[10.5rem] shrink-0 flex-wrap justify-end gap-1.5">
                      {(point.devices?.smartwatch ?? 0) > 0 ? (
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white/90">
                          <Watch size={16} />
                          <span className="absolute -right-1 -top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full border border-white/70 bg-slate-900/90 px-1 text-[9px] font-semibold leading-none text-white">
                            {point.devices?.smartwatch}
                          </span>
                        </span>
                      ) : null}
                      {(point.devices?.tablet ?? 0) > 0 ? (
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white/90">
                          <Tablet size={16} />
                          <span className="absolute -right-1 -top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full border border-white/70 bg-slate-900/90 px-1 text-[9px] font-semibold leading-none text-white">
                            {point.devices?.tablet}
                          </span>
                        </span>
                      ) : null}
                      {(point.devices?.smartphone ?? 0) > 0 ? (
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white/90">
                          <Smartphone size={16} />
                          <span className="absolute -right-1 -top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full border border-white/70 bg-slate-900/90 px-1 text-[9px] font-semibold leading-none text-white">
                            {point.devices?.smartphone}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
