import type { MockEntityState, MockEntityStateMap } from '../../types/ha';
import type { CoverDeviceClass } from './coverCardModel';
import {
  COVER_FEATURE_CLOSE,
  COVER_FEATURE_CLOSE_TILT,
  COVER_FEATURE_OPEN,
  COVER_FEATURE_OPEN_TILT,
  COVER_FEATURE_SET_POSITION,
  COVER_FEATURE_SET_TILT_POSITION,
  COVER_FEATURE_STOP,
  COVER_FEATURE_STOP_TILT,
} from '../../utils/coverUtils';

export const COVER_MAX_COMPAT_MOCK_ENTITY_ID = 'cover.max_compat_cover';
export const COVER_DEVICE_CLASS_MOCK_ENTITY_IDS = [
  'cover.living_room_shutter',
  'cover.kitchen_blind',
  'cover.bedroom_curtain',
  'cover.patio_awning',
  'cover.bedroom_shade',
  'cover.air_damper',
  'cover.front_door',
  'cover.garage_door',
  'cover.driveway_gate',
  'cover.office_window',
] as const;

export const COVER_MOCK_STATES = [
  'open',
  'opening',
  'closing',
  'closed',
  'stopped',
  'unavailable',
  'unknown',
] as const;

export type CoverMockState = (typeof COVER_MOCK_STATES)[number];

export const COVER_MAX_COMPAT_FEATURES =
  COVER_FEATURE_OPEN |
  COVER_FEATURE_CLOSE |
  COVER_FEATURE_SET_POSITION |
  COVER_FEATURE_STOP |
  COVER_FEATURE_OPEN_TILT |
  COVER_FEATURE_CLOSE_TILT |
  COVER_FEATURE_STOP_TILT |
  COVER_FEATURE_SET_TILT_POSITION;

const COVER_POSITION_FEATURES =
  COVER_FEATURE_OPEN |
  COVER_FEATURE_CLOSE |
  COVER_FEATURE_STOP |
  COVER_FEATURE_SET_POSITION;

const COVER_TILT_FEATURES =
  COVER_FEATURE_OPEN_TILT |
  COVER_FEATURE_CLOSE_TILT |
  COVER_FEATURE_STOP_TILT |
  COVER_FEATURE_SET_TILT_POSITION;

const COVER_DEVICE_CLASS_MOCKS: Array<{
  entityId: (typeof COVER_DEVICE_CLASS_MOCK_ENTITY_IDS)[number];
  friendlyName: string;
  deviceClass: CoverDeviceClass;
  position: number;
  tiltPosition?: number;
}> = [
  {
    entityId: 'cover.living_room_shutter',
    friendlyName: 'Tapparella soggiorno',
    deviceClass: 'shutter',
    position: 76,
    tiltPosition: 45,
  },
  {
    entityId: 'cover.kitchen_blind',
    friendlyName: 'Veneziana cucina',
    deviceClass: 'blind',
    position: 64,
    tiltPosition: 66,
  },
  {
    entityId: 'cover.bedroom_curtain',
    friendlyName: 'Tenda camera',
    deviceClass: 'curtain',
    position: 58,
  },
  {
    entityId: 'cover.patio_awning',
    friendlyName: 'Tenda da sole patio',
    deviceClass: 'awning',
    position: 44,
  },
  {
    entityId: 'cover.bedroom_shade',
    friendlyName: 'Tenda oscurante camera',
    deviceClass: 'shade',
    position: 28,
  },
  {
    entityId: 'cover.air_damper',
    friendlyName: 'Serranda aria cucina',
    deviceClass: 'damper',
    position: 52,
    tiltPosition: 35,
  },
  {
    entityId: 'cover.front_door',
    friendlyName: 'Porta ingresso',
    deviceClass: 'door',
    position: 100,
  },
  {
    entityId: 'cover.garage_door',
    friendlyName: 'Porta garage',
    deviceClass: 'garage',
    position: 22,
  },
  {
    entityId: 'cover.driveway_gate',
    friendlyName: 'Cancello vialetto',
    deviceClass: 'gate',
    position: 8,
  },
  {
    entityId: 'cover.office_window',
    friendlyName: 'Finestra studio',
    deviceClass: 'window',
    position: 88,
  },
];

function resolveMockPosition(state: CoverMockState) {
  if (state === 'closed') return 0;
  if (state === 'closing') return 28;
  if (state === 'stopped') return 52;
  if (state === 'opening') return 68;
  return 82;
}

function resolveFriendlyName(state: CoverMockState) {
  if (state === 'unavailable') return 'Cover demo offline';
  if (state === 'unknown') return 'Cover demo stato sconosciuto';
  return 'Cover massima compatibilita';
}

export function createCoverMock(state: CoverMockState = 'open'): MockEntityState {
  const position = resolveMockPosition(state);
  const tiltPosition = state === 'closed' ? 0 : state === 'closing' ? 22 : 45;
  const isAvailable = state !== 'unavailable' && state !== 'unknown';

  return {
    state,
    stateLabel: state,
    numericValue: position,
    toggleOn: isAvailable && position > 0,
    supportedFeatures: COVER_MAX_COMPAT_FEATURES,
    rawAttributes: {
      friendly_name: resolveFriendlyName(state),
      device_class: 'shutter',
      supported_features: COVER_MAX_COMPAT_FEATURES,
      current_cover_position: position,
      current_position: position,
      position,
      current_cover_tilt_position: tiltPosition,
      current_tilt_position: tiltPosition,
      tilt_position: tiltPosition,
      demo_supported_states: COVER_MOCK_STATES,
    },
  };
}

function createCoverDeviceClassMock({
  friendlyName,
  deviceClass,
  position,
  tiltPosition,
}: (typeof COVER_DEVICE_CLASS_MOCKS)[number]): MockEntityState {
  const supportedFeatures =
    COVER_POSITION_FEATURES |
    (typeof tiltPosition === 'number' ? COVER_TILT_FEATURES : 0);
  const rawAttributes: Record<string, unknown> = {
    friendly_name: friendlyName,
    device_class: deviceClass,
    supported_features: supportedFeatures,
    current_cover_position: position,
    current_position: position,
    position,
  };

  if (typeof tiltPosition === 'number') {
    rawAttributes.current_cover_tilt_position = tiltPosition;
    rawAttributes.current_tilt_position = tiltPosition;
    rawAttributes.tilt_position = tiltPosition;
  }

  return {
    state: position <= 0 ? 'closed' : 'open',
    stateLabel: position <= 0 ? 'closed' : 'open',
    numericValue: position,
    toggleOn: position > 0,
    supportedFeatures,
    rawAttributes,
  };
}

export function createCoverStateMocks(): MockEntityStateMap {
  const stateMocks = COVER_MOCK_STATES.reduce<MockEntityStateMap>((stateMap, state) => {
    const entityId =
      state === 'open'
        ? COVER_MAX_COMPAT_MOCK_ENTITY_ID
        : `cover.max_compat_${state}`;
    stateMap[entityId] = createCoverMock(state);
    return stateMap;
  }, {});

  COVER_DEVICE_CLASS_MOCKS.forEach((fixture) => {
    stateMocks[fixture.entityId] = createCoverDeviceClassMock(fixture);
  });

  return stateMocks;
}
