import type { MockEntityState, MockEntityStateMap } from '../../types/ha';

export const CAMERA_MAX_COMPAT_MOCK_ENTITY_ID = 'camera.front_door';
export const CAMERA_MOCK_DEVICE_ID = 'demo-camera-front-door-device';

export const CAMERA_MOCK_RELATED_ENTITY_IDS = [
  'binary_sensor.front_door_motion',
  'binary_sensor.front_door_person',
  'event.front_door_doorbell',
  'image.front_door_last_event',
  'switch.front_door_motion_detection',
  'switch.front_door_privacy_mode',
  'select.front_door_night_vision',
  'number.front_door_detection_sensitivity',
  'button.front_door_snapshot',
  'siren.front_door_siren',
  'light.front_door_status_led',
  'sensor.front_door_battery',
  'sensor.front_door_signal',
  'sensor.front_door_storage',
  'sensor.front_door_firmware',
] as const;

function createCameraArtwork(accent = '#54d6ff', glow = '#5375ff') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#07111f"/><stop offset="0.58" stop-color="#13243b"/><stop offset="1" stop-color="#081019"/>
        </linearGradient>
        <radialGradient id="light"><stop stop-color="${accent}" stop-opacity=".68"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
      </defs>
      <rect width="960" height="540" fill="url(#sky)"/>
      <circle cx="720" cy="120" r="230" fill="url(#light)" filter="url(#blur)"/>
      <path d="M0 390 150 260 280 360 410 210 575 355 720 245 960 390V540H0Z" fill="#102c35"/>
      <path d="M0 438 170 330 310 430 470 290 640 435 790 335 960 430V540H0Z" fill="#0b1f27"/>
      <rect x="360" y="260" width="240" height="210" rx="10" fill="#17212a"/>
      <path d="m320 285 160-120 160 120" fill="#223241"/>
      <rect x="448" y="345" width="70" height="125" rx="5" fill="#0b1118"/>
      <rect x="385" y="310" width="48" height="55" rx="5" fill="${accent}" fill-opacity=".45"/>
      <rect x="535" y="310" width="40" height="55" rx="5" fill="${accent}" fill-opacity=".32"/>
      <ellipse cx="480" cy="500" rx="350" ry="34" fill="#000" fill-opacity=".35"/>
      <text x="38" y="48" fill="#fff" fill-opacity=".78" font-family="system-ui" font-size="18" font-weight="600">Ingresso principale • LIVE</text>
      <text x="38" y="76" fill="#fff" fill-opacity=".42" font-family="system-ui" font-size="14">Mock camera completa</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function baseAttributes(friendlyName: string, extra: Record<string, unknown> = {}) {
  return {
    friendly_name: friendlyName,
    demo_device_id: CAMERA_MOCK_DEVICE_ID,
    ...extra,
  };
}

export function createCameraStateMocks(): MockEntityStateMap {
  const liveArtwork = createCameraArtwork();
  const personArtwork = createCameraArtwork('#ffbf69', '#ff5d8f');
  const doorbellArtwork = createCameraArtwork('#8fffd3', '#2fa7ff');
  const eventLog = [
    {
      title: 'Persona rilevata',
      type: 'person',
      timestamp: isoHoursAgo(0.35),
      thumbnail_url: personArtwork,
      clip_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
    {
      title: 'Movimento all’ingresso',
      type: 'motion',
      timestamp: isoHoursAgo(1.4),
      thumbnail_url: liveArtwork,
    },
    {
      title: 'Campanello premuto',
      type: 'doorbell',
      timestamp: isoHoursAgo(3.1),
      thumbnail_url: doorbellArtwork,
    },
    {
      title: 'Suono rilevato',
      type: 'sound',
      timestamp: isoHoursAgo(5.8),
    },
    {
      title: 'Veicolo rilevato',
      type: 'vehicle',
      timestamp: isoHoursAgo(20.5),
      thumbnail_url: liveArtwork,
    },
    {
      title: 'Movimento notturno',
      type: 'motion',
      timestamp: isoHoursAgo(25.2),
      thumbnail_url: doorbellArtwork,
    },
  ];

  const states: MockEntityStateMap = {
    [CAMERA_MAX_COMPAT_MOCK_ENTITY_ID]: {
      state: 'streaming',
      stateLabel: 'Live',
      imageUrl: liveArtwork,
      supportedFeatures: 3,
      rawAttributes: baseAttributes('Videocamera ingresso', {
        brand: 'Lucide Labs',
        model: 'Vision Pro Secure',
        supports_ptz: true,
        ptz_presets: ['Ingresso', 'Vialetto', 'Cancello'],
        motion_detection_enabled: true,
        is_recording: true,
        entity_picture: liveArtwork,
        event_log: eventLog,
        demo_related_entities: [...CAMERA_MOCK_RELATED_ENTITY_IDS],
        demo_device_info: {
          id: CAMERA_MOCK_DEVICE_ID,
          name: 'Videocamera ingresso',
          manufacturer: 'Lucide Labs',
          model: 'Vision Pro Secure',
          swVersion: '2.8.4',
          hwVersion: 'VP-2',
          areaId: 'garden',
        },
      }),
    },
    'binary_sensor.front_door_motion': {
      state: 'on', stateLabel: 'Rilevato', toggleOn: true,
      rawAttributes: baseAttributes('Movimento ingresso', { device_class: 'motion', __last_changed: isoHoursAgo(0.35) }),
    },
    'binary_sensor.front_door_person': {
      state: 'off', stateLabel: 'Nessuna persona', toggleOn: false,
      rawAttributes: baseAttributes('Rilevamento persone', { device_class: 'occupancy', __last_changed: isoHoursAgo(0.35) }),
    },
    'event.front_door_doorbell': {
      state: isoHoursAgo(3.1), stateLabel: 'Campanello',
      rawAttributes: baseAttributes('Campanello ingresso', { device_class: 'doorbell', event_type: 'pressed', __last_changed: isoHoursAgo(3.1) }),
    },
    'image.front_door_last_event': {
      state: isoHoursAgo(0.35), stateLabel: 'Ultima acquisizione', imageUrl: personArtwork,
      rawAttributes: baseAttributes('Ultimo evento', { device_class: 'camera', entity_picture: personArtwork, __last_changed: isoHoursAgo(0.35) }),
    },
    'switch.front_door_motion_detection': {
      state: 'on', stateLabel: 'Attivo', toggleOn: true,
      rawAttributes: baseAttributes('Rilevamento movimento'),
    },
    'switch.front_door_privacy_mode': {
      state: 'off', stateLabel: 'Disattivata', toggleOn: false,
      rawAttributes: baseAttributes('Modalità privacy'),
    },
    'select.front_door_night_vision': {
      state: 'Auto', stateLabel: 'Auto',
      rawAttributes: baseAttributes('Visione notturna', { options: ['Auto', 'Sempre attiva', 'Disattivata'] }),
    },
    'number.front_door_detection_sensitivity': {
      state: '72', stateLabel: '72', numericValue: 72, unit: '%',
      rawAttributes: baseAttributes('Sensibilità rilevamento', { min: 0, max: 100, step: 1, unit_of_measurement: '%' }),
    },
    'button.front_door_snapshot': {
      state: isoHoursAgo(2), stateLabel: 'Pronto',
      rawAttributes: baseAttributes('Scatta istantanea'),
    },
    'siren.front_door_siren': {
      state: 'off', stateLabel: 'Spenta', toggleOn: false,
      rawAttributes: baseAttributes('Sirena camera'),
    },
    'light.front_door_status_led': {
      state: 'on', stateLabel: 'Acceso', toggleOn: true, brightness: 55,
      rawAttributes: baseAttributes('LED di stato', { brightness: 140 }),
    },
    'sensor.front_door_battery': {
      state: '86', stateLabel: '86', numericValue: 86, unit: '%',
      rawAttributes: baseAttributes('Batteria camera', { device_class: 'battery', unit_of_measurement: '%' }),
    },
    'sensor.front_door_signal': {
      state: '-52', stateLabel: '-52', numericValue: -52, unit: 'dBm',
      rawAttributes: baseAttributes('Segnale Wi-Fi', { device_class: 'signal_strength', unit_of_measurement: 'dBm' }),
    },
    'sensor.front_door_storage': {
      state: '64', stateLabel: '64', numericValue: 64, unit: '%',
      rawAttributes: baseAttributes('Memoria utilizzata', { unit_of_measurement: '%' }),
    },
    'sensor.front_door_firmware': {
      state: '2.8.4', stateLabel: '2.8.4',
      rawAttributes: baseAttributes('Firmware camera'),
    },
  };

  return states;
}
