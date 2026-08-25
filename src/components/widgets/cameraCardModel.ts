import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';

const CAMERA_FEATURE_ON_OFF = 1;
const CAMERA_FEATURE_STREAM = 2;

export type CameraCardTone = 'live' | 'recording' | 'idle' | 'offline';

export type CameraCardModel = {
  title: string;
  entityId: string;
  state: string;
  statusLabel: string;
  subtitle: string;
  tone: CameraCardTone;
  isAvailable: boolean;
  isLive: boolean;
  isRecording: boolean;
  isStreaming: boolean;
  isMotionEnabled: boolean;
  supportsStream: boolean;
  supportsOnOff: boolean;
  imageUrl?: string;
  streamUrl?: string;
  brand?: string;
  model?: string;
};

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'on', 'enabled', '1'].includes(normalized)) return true;
    if (['false', 'no', 'off', 'disabled', '0'].includes(normalized)) return false;
  }
  return undefined;
}

function normalizeCameraState(value: string | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

function isUnavailableState(value: string) {
  return ['unavailable', 'unknown', 'error', 'problem', 'disconnected', 'offline'].includes(value);
}

function resolveStatusLabel(state: string, fallback?: string) {
  if (state === 'recording') return 'REC';
  if (state === 'streaming') return 'Live';
  if (state === 'idle') return 'Idle';
  if (state === 'off') return 'Spenta';
  if (isUnavailableState(state)) return 'Offline';
  return fallback?.trim() || 'Online';
}

function resolveTone(state: string): CameraCardTone {
  if (state === 'recording') return 'recording';
  if (state === 'streaming') return 'live';
  if (state === 'idle' || state === 'off') return 'idle';
  if (isUnavailableState(state)) return 'offline';
  return 'live';
}

function hasFeature(supportedFeatures: number | undefined, feature: number) {
  return typeof supportedFeatures === 'number' && (supportedFeatures & feature) === feature;
}

function resolveSubtitle({
  isAvailable,
  isMotionEnabled,
  brand,
  model,
  supportsStream,
}: {
  isAvailable: boolean;
  isMotionEnabled: boolean;
  brand?: string;
  model?: string;
  supportsStream: boolean;
}) {
  if (!isAvailable) return 'Non disponibile';
  const deviceLabel = model ?? brand;
  if (deviceLabel && isMotionEnabled) return `${deviceLabel} • Motion attiva`;
  if (isMotionEnabled) return 'Motion attiva';
  if (deviceLabel) return deviceLabel;
  return supportsStream ? 'Stream disponibile' : 'Snapshot disponibile';
}

export function buildCameraCardModel(widget: Widget, liveEntity?: MockEntityState): CameraCardModel {
  const attributes = liveEntity?.rawAttributes ?? {};
  const entityId = widget.entityId;
  const state = normalizeCameraState(
    toTrimmedString(liveEntity?.stateLabel) ??
      toTrimmedString(liveEntity?.state) ??
      toTrimmedString(widget.status) ??
      '',
  );
  const supportedFeatures = liveEntity?.supportedFeatures;
  const isAvailable = !isUnavailableState(state);
  const isRecording = state === 'recording' || toBoolean(attributes.is_recording) === true;
  const isStreaming = state === 'streaming' || toBoolean(attributes.is_streaming) === true;
  const semanticState = isRecording ? 'recording' : isStreaming ? 'streaming' : state;
  const statusLabel = resolveStatusLabel(semanticState, widget.status);
  const tone = isAvailable ? resolveTone(semanticState) : 'offline';
  const imageUrl =
    toTrimmedString(liveEntity?.imageUrl) ??
    toTrimmedString(attributes.entity_picture) ??
    toTrimmedString(attributes.cameraUrl) ??
    toTrimmedString(attributes.camera_url) ??
    (entityId ? `/api/camera_proxy/${encodeURIComponent(entityId)}` : undefined);
  const streamUrl = entityId ? `/api/camera_proxy_stream/${encodeURIComponent(entityId)}` : undefined;
  const brand = toTrimmedString(attributes.brand);
  const model = toTrimmedString(attributes.model);
  const supportsStream = hasFeature(supportedFeatures, CAMERA_FEATURE_STREAM) || Boolean(streamUrl);
  const supportsOnOff = hasFeature(supportedFeatures, CAMERA_FEATURE_ON_OFF);
  const isMotionEnabled =
    toBoolean(attributes.motion_detection_enabled) ??
    toBoolean(attributes.motion_detected) ??
    toBoolean(attributes.motion) ??
    false;

  return {
    title: toTrimmedString(attributes.friendly_name) ?? widget.title,
    entityId,
    state,
    statusLabel,
    subtitle: resolveSubtitle({ isAvailable, isMotionEnabled, brand, model, supportsStream }),
    tone,
    isAvailable,
    isLive: isAvailable && (isStreaming || state === 'streaming' || state === ''),
    isRecording,
    isStreaming,
    isMotionEnabled,
    supportsStream,
    supportsOnOff,
    imageUrl,
    streamUrl,
    brand,
    model,
  };
}
