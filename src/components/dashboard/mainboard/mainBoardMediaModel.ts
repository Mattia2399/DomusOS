import { normalizeMediaPlayerStateKey } from '../../../utils/mediaPlayerState';
import { normalizeLower, toTrimmedString } from './mainBoardValueUtils';

export const MEDIA_COMMAND_TTL_MS = 8000;

export type MediaRepeatMode = 'off' | 'all' | 'one';

export function resolveMediaState(value: string | undefined) {
  return normalizeMediaPlayerStateKey(value);
}

export function resolveMediaRepeatMode(value: unknown): MediaRepeatMode {
  const normalized = normalizeLower(toTrimmedString(value));
  if (normalized === 'one' || normalized === 'single' || normalized === 'track' || normalized === '1') {
    return 'one';
  }
  if (normalized === 'all' || normalized === 'playlist' || normalized === 'on' || normalized === 'true') {
    return 'all';
  }
  return 'off';
}
