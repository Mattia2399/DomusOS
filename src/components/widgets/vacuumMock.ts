import type { MockEntityState, MockEntityStateMap } from '../../types/ha';
import {
  VACUUM_FEATURE_CLEAN_AREA,
  VACUUM_FEATURE_CLEAN_SPOT,
  VACUUM_FEATURE_FAN_SPEED,
  VACUUM_FEATURE_LOCATE,
  VACUUM_FEATURE_MAP,
  VACUUM_FEATURE_PAUSE,
  VACUUM_FEATURE_RETURN_HOME,
  VACUUM_FEATURE_SEND_COMMAND,
  VACUUM_FEATURE_START,
  VACUUM_FEATURE_STATE,
  VACUUM_FEATURE_STOP,
} from './vacuumCardModel';

export const VACUUM_MAX_COMPAT_MOCK_ENTITY_ID = 'vacuum.demo_robot';
export const VACUUM_MOCK_DEVICE_ID = 'demo-vacuum-omni-device';

export const VACUUM_MOCK_RELATED_ENTITY_IDS = [
  'image.demo_robot_map',
  'sensor.demo_robot_battery',
  'sensor.demo_robot_cleaned_area',
  'sensor.demo_robot_cleaning_time',
  'sensor.demo_robot_filter_life',
  'sensor.demo_robot_main_brush',
  'sensor.demo_robot_side_brush',
  'sensor.demo_robot_signal',
  'select.demo_robot_water_level',
  'select.demo_robot_mop_intensity',
  'switch.demo_robot_dnd',
  'switch.demo_robot_carpet_boost',
  'number.demo_robot_voice_volume',
  'button.demo_robot_reset_filter',
  'update.demo_robot_firmware',
] as const;

export const VACUUM_MOCK_SUPPORTED_FEATURES =
  VACUUM_FEATURE_STATE |
  VACUUM_FEATURE_START |
  VACUUM_FEATURE_PAUSE |
  VACUUM_FEATURE_STOP |
  VACUUM_FEATURE_RETURN_HOME |
  VACUUM_FEATURE_FAN_SPEED |
  VACUUM_FEATURE_SEND_COMMAND |
  VACUUM_FEATURE_LOCATE |
  VACUUM_FEATURE_CLEAN_SPOT |
  VACUUM_FEATURE_MAP |
  VACUUM_FEATURE_CLEAN_AREA;

function createVacuumMapArtwork() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071b2b"/><stop offset="1" stop-color="#0c2730"/></linearGradient>
      <linearGradient id="room" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5eead4" stop-opacity=".22"/><stop offset="1" stop-color="#38bdf8" stop-opacity=".08"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <rect width="900" height="620" rx="34" fill="url(#bg)"/>
    <g stroke="#c5fff5" stroke-opacity=".24" stroke-width="7" fill="url(#room)">
      <path d="M45 45h305v215H45z"/><path d="M365 45h490v215H365z"/><path d="M45 275h220v300H45z"/><path d="M280 275h315v300H280z"/><path d="M610 275h245v300H610z"/>
    </g>
    <g fill="#d9fff8" fill-opacity=".55" font-family="system-ui" font-size="20" font-weight="600">
      <text x="72" y="82">Cucina</text><text x="392" y="82">Salotto</text><text x="72" y="315">Ingresso</text><text x="307" y="315">Camera</text><text x="637" y="315">Bagno</text>
    </g>
    <path d="M120 190h160v-72H110v105h690V120H440v390H165V355h355v135h245V330" fill="none" stroke="#5eead4" stroke-opacity=".52" stroke-width="5" stroke-linecap="round" stroke-dasharray="9 10"/>
    <circle cx="520" cy="490" r="35" fill="#2dd4bf" opacity=".28" filter="url(#glow)"/><circle cx="520" cy="490" r="22" fill="#5eead4"/><circle cx="513" cy="483" r="5" fill="#fff" fill-opacity=".8"/>
    <rect x="790" y="510" width="44" height="36" rx="10" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".32"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function attrs(name: string, extra: Record<string, unknown> = {}) {
  return { friendly_name: name, demo_device_id: VACUUM_MOCK_DEVICE_ID, ...extra };
}

export function createVacuumStateMocks(): MockEntityStateMap {
  const mapUrl = createVacuumMapArtwork();
  const related = [...VACUUM_MOCK_RELATED_ENTITY_IDS];
  const registryOptions = {
    vacuum: {
      area_mapping: {
        kitchen: ['segment-kitchen'],
        living_room: ['segment-living-a', 'segment-living-b'],
        bedroom: ['segment-bedroom'],
        bathroom: ['segment-bathroom'],
      },
      last_seen_segments: [
        { id: 'segment-kitchen', name: 'Cucina', group: 'Piano terra' },
        { id: 'segment-living-a', name: 'Salotto A', group: 'Piano terra' },
        { id: 'segment-living-b', name: 'Salotto B', group: 'Piano terra' },
        { id: 'segment-bedroom', name: 'Camera', group: 'Piano terra' },
        { id: 'segment-bathroom', name: 'Bagno', group: 'Piano terra' },
      ],
    },
  };
  const mainAttributes = attrs('Robot aspirapolvere', {
    fan_speed: 'balanced',
    fan_speed_list: ['silent', 'balanced', 'turbo', 'max'],
    supported_features: VACUUM_MOCK_SUPPORTED_FEATURES,
    demo_related_entities: related,
    demo_registry_options: registryOptions,
    demo_device_info: {
      id: VACUUM_MOCK_DEVICE_ID,
      name: 'Lucide Omni Clean',
      manufacturer: 'Lucide Labs',
      model: 'Omni Clean X1',
      swVersion: '4.6.2',
      hwVersion: 'OCX1-EU',
      areaId: 'living_room',
      configurationUrl: 'https://www.home-assistant.io/',
    },
  });
  const main = (state: string, label: string): MockEntityState => ({
    state,
    stateLabel: label,
    supportedFeatures: VACUUM_MOCK_SUPPORTED_FEATURES,
    rawAttributes: { ...mainAttributes },
  });

  return {
    [VACUUM_MAX_COMPAT_MOCK_ENTITY_ID]: main('docked', 'Alla base'),
    'vacuum.demo_robot_cleaning': main('cleaning', 'Pulizia in corso'),
    'vacuum.demo_robot_paused': main('paused', 'In pausa'),
    'vacuum.demo_robot_returning': main('returning', 'Ritorno alla base'),
    'vacuum.demo_robot_idle': main('idle', 'Pronto'),
    'vacuum.demo_robot_error': {
      ...main('error', 'Errore'),
      rawAttributes: { ...mainAttributes, error: 'Spazzola principale bloccata' },
    },
    'vacuum.demo_robot_unavailable': main('unavailable', 'Non disponibile'),
    'image.demo_robot_map': {
      state: new Date().toISOString(),
      stateLabel: 'Mappa aggiornata',
      imageUrl: mapUrl,
      rawAttributes: attrs('Mappa pulizia', { entity_picture: mapUrl, device_class: 'map' }),
    },
    'sensor.demo_robot_battery': {
      state: '82', stateLabel: '82', numericValue: 82, unit: '%',
      rawAttributes: attrs('Batteria', { device_class: 'battery', unit_of_measurement: '%' }),
    },
    'sensor.demo_robot_cleaned_area': {
      state: '47.6', stateLabel: '47.6', numericValue: 47.6, unit: 'm²',
      rawAttributes: attrs('Area pulita', { unit_of_measurement: 'm²', state_class: 'measurement' }),
    },
    'sensor.demo_robot_cleaning_time': {
      state: '38', stateLabel: '38', numericValue: 38, unit: 'min',
      rawAttributes: attrs('Tempo pulizia', { device_class: 'duration', unit_of_measurement: 'min' }),
    },
    'sensor.demo_robot_filter_life': {
      state: '72', stateLabel: '72', numericValue: 72, unit: '%',
      rawAttributes: attrs('Vita filtro', { unit_of_measurement: '%', entity_category: 'diagnostic' }),
    },
    'sensor.demo_robot_main_brush': {
      state: '84', stateLabel: '84', numericValue: 84, unit: '%',
      rawAttributes: attrs('Spazzola principale', { unit_of_measurement: '%', entity_category: 'diagnostic' }),
    },
    'sensor.demo_robot_side_brush': {
      state: '61', stateLabel: '61', numericValue: 61, unit: '%',
      rawAttributes: attrs('Spazzola laterale', { unit_of_measurement: '%', entity_category: 'diagnostic' }),
    },
    'sensor.demo_robot_signal': {
      state: '-49', stateLabel: '-49', numericValue: -49, unit: 'dBm',
      rawAttributes: attrs('Segnale Wi-Fi', { device_class: 'signal_strength', unit_of_measurement: 'dBm', entity_category: 'diagnostic' }),
    },
    'select.demo_robot_water_level': {
      state: 'Medio', stateLabel: 'Medio',
      rawAttributes: attrs('Livello acqua', { options: ['Basso', 'Medio', 'Alto'] }),
    },
    'select.demo_robot_mop_intensity': {
      state: 'Standard', stateLabel: 'Standard',
      rawAttributes: attrs('Intensità lavaggio', { options: ['Delicato', 'Standard', 'Profondo'] }),
    },
    'switch.demo_robot_dnd': {
      state: 'off', stateLabel: 'Disattivata', toggleOn: false,
      rawAttributes: attrs('Non disturbare'),
    },
    'switch.demo_robot_carpet_boost': {
      state: 'on', stateLabel: 'Attivo', toggleOn: true,
      rawAttributes: attrs('Boost tappeti'),
    },
    'number.demo_robot_voice_volume': {
      state: '45', stateLabel: '45', numericValue: 45, unit: '%',
      rawAttributes: attrs('Volume voce', { min: 0, max: 100, step: 5, unit_of_measurement: '%' }),
    },
    'button.demo_robot_reset_filter': {
      state: new Date(Date.now() - 86400000).toISOString(), stateLabel: 'Pronto',
      rawAttributes: attrs('Azzera vita filtro'),
    },
    'update.demo_robot_firmware': {
      state: 'off', stateLabel: 'Aggiornato', toggleOn: false,
      rawAttributes: attrs('Firmware', { installed_version: '4.6.2', latest_version: '4.6.2', entity_category: 'diagnostic' }),
    },
  };
}
