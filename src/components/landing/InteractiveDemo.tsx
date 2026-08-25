import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { useDashboardState } from '../../hooks/useDashboardState';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { WidgetCardRenderer } from '../widgets/CardRenderer';
import { SECTION_IDS } from './brand';

/**
 * Live demo board.
 *
 * The cards are rendered at the EXACT geometry of the production grid engine:
 * every row unit is 48px tall with a 16px gap (see GRID_ENGINE_ROW_UNIT_PX /
 * GRID_ENGINE_GAP_PX), and each card uses its canonical span from the card
 * capability registry. That guarantees each WidgetCardRenderer resolves the
 * same responsive variant it would on a real dashboard — no distorted shapes.
 *
 * Desktop (md+): explicit 8-column placement that tiles the board with zero gaps.
 * Mobile (<md): the same cards reflow into a gapless 2-column stack.
 */

type DemoCardId = 'climate' | 'alarm' | 'light' | 'switch' | 'camera' | 'media' | 'cover';

const MEDIA_DURATION_SECONDS = 4200;
const DEMO_ARTWORK = '/wallpapers/apple-home-hub.webp';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const DEMO_WIDGETS = {
  climate: {
    id: 'climate.air_conditioner',
    kind: 'climate',
    title: 'Clima soggiorno',
    entityId: 'climate.air_conditioner',
    status: 'heat',
    isOn: true,
    value: 22.5,
    unit: 'C',
    layout: { i: 'climate.air_conditioner', x: 0, y: 0, w: 3, h: 3 },
  },
  alarm: {
    id: 'landing.alarm.standard',
    kind: 'alarm',
    title: 'Allarme casa',
    entityId: 'alarm_control_panel.home_alarm',
    status: 'armed_home',
    isOn: true,
    alarmRequireAuthToDisarm: true,
    layout: { i: 'landing.alarm.standard', x: 3, y: 0, w: 3, h: 3 },
  },
  light: {
    id: 'landing.light',
    kind: 'light',
    title: 'Luce salotto',
    entityId: 'light.living_room_lamp',
    status: 'on',
    isOn: true,
    value: 68,
    unit: '%',
    layout: { i: 'landing.light', x: 6, y: 0, w: 2, h: 2 },
  },
  switch: {
    id: 'landing.switch.compact',
    kind: 'switch',
    title: 'Presa cucina',
    entityId: 'switch.kitchen_outlet',
    status: 'on',
    isOn: true,
    switchConsumptionEntityId: 'sensor.kitchen_outlet_power',
    layout: { i: 'landing.switch.compact', x: 6, y: 2, w: 2, h: 1 },
  },
  camera: {
    id: 'landing.camera',
    kind: 'camera',
    title: 'Ingresso',
    entityId: 'camera.front_door',
    status: 'streaming',
    isOn: true,
    layout: { i: 'landing.camera', x: 0, y: 3, w: 4, h: 3 },
  },
  media: {
    id: 'landing.media',
    kind: 'media',
    title: 'Soggiorno',
    entityId: 'media_player.living_room',
    status: 'playing',
    isOn: true,
    layout: { i: 'landing.media', x: 4, y: 3, w: 2, h: 3 },
  },
  cover: {
    id: 'landing.cover',
    kind: 'cover',
    title: 'Tenda soggiorno',
    entityId: 'cover.living_room',
    status: 'open',
    isOn: true,
    layout: { i: 'landing.cover', x: 6, y: 3, w: 2, h: 3 },
  },
} satisfies Record<DemoCardId, Widget>;

/**
 * Placement classes. Mobile (base) uses span-only + dense auto-flow; md+ uses
 * explicit start/span to reproduce the exact 8×6 board. Full literal strings so
 * Tailwind's scanner keeps the classes.
 */
const PLACEMENT: Record<DemoCardId, string> = {
  climate: 'col-span-2 row-span-3 md:col-start-1 md:col-span-3 md:row-start-1 md:row-span-3',
  alarm: 'col-span-2 row-span-3 md:col-start-4 md:col-span-3 md:row-start-1 md:row-span-3',
  light: 'col-span-2 row-span-2 md:col-start-7 md:col-span-2 md:row-start-1 md:row-span-2',
  switch: 'col-span-2 row-span-1 md:col-start-7 md:col-span-2 md:row-start-3 md:row-span-1',
  camera: 'col-span-2 row-span-3 md:col-start-1 md:col-span-4 md:row-start-4 md:row-span-3',
  media: 'col-span-1 row-span-3 md:col-start-5 md:col-span-2 md:row-start-4 md:row-span-3',
  cover: 'col-span-1 row-span-3 md:col-start-7 md:col-span-2 md:row-start-4 md:row-span-3',
};

/**
 * The Light card is auto-expandable: OFF it collapses to a single row (name only),
 * ON it grows to two rows (name + brightness slider) — the real dashboard behavior.
 * The Switch below it shifts up when the Light collapses so the column stays tidy.
 */
const LIGHT_PLACEMENT = {
  on: 'col-span-2 row-span-2 md:col-start-7 md:col-span-2 md:row-start-1 md:row-span-2',
  off: 'col-span-2 row-span-1 md:col-start-7 md:col-span-2 md:row-start-1 md:row-span-1',
} as const;
const SWITCH_PLACEMENT = {
  lightOn: 'col-span-2 row-span-1 md:col-start-7 md:col-span-2 md:row-start-3 md:row-span-1',
  lightOff: 'col-span-2 row-span-1 md:col-start-7 md:col-span-2 md:row-start-2 md:row-span-1',
} as const;

/** DOM order tuned so the mobile dense flow packs with zero gaps. */
const CARD_ORDER: DemoCardId[] = ['climate', 'alarm', 'camera', 'media', 'cover', 'light', 'switch'];

const CARD_LABEL: Record<DemoCardId, string> = {
  climate: 'Clima',
  alarm: 'Allarme',
  light: 'Luce',
  switch: 'Presa',
  camera: 'Telecamera',
  media: 'Media player',
  cover: 'Tenda',
};

function Cell({
  id,
  activeCard,
  placement,
  children,
}: {
  id: DemoCardId;
  activeCard: DemoCardId;
  placement?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative min-h-0 min-w-0 rounded-[1.75rem] transition-shadow duration-300 ${placement ?? PLACEMENT[id]} ${
        activeCard === id ? 'ring-1 ring-cyan-200/45 ring-offset-2 ring-offset-[#080b12]' : ''
      }`}
    >
      {children}
    </div>
  );
}

export const InteractiveDemo = () => {
  const { state, actions } = useDashboardState();
  const [activeCard, setActiveCard] = useState<DemoCardId>('climate');
  const [lampOn, setLampOn] = useState(true);
  const [lampBrightness, setLampBrightness] = useState(68);
  const [switchOn, setSwitchOn] = useState(true);
  const [alarmState, setAlarmState] = useState('armed_home');
  const [cameraLive, setCameraLive] = useState(true);
  const [mediaPlaying, setMediaPlaying] = useState(true);
  const [mediaProgress, setMediaProgress] = useState(38);
  const [coverPosition, setCoverPosition] = useState(60);

  const select = (id: DemoCardId) => setActiveCard(id);

  const lightPlacement = lampOn ? LIGHT_PLACEMENT.on : LIGHT_PLACEMENT.off;
  const switchPlacement = lampOn ? SWITCH_PLACEMENT.lightOn : SWITCH_PLACEMENT.lightOff;

  // Brightness-only light → the card renders just name + slider (no colour/temp).
  const lightBrightness255 = Math.round((lampBrightness / 100) * 255);
  const lightEntity: MockEntityState = {
    state: lampOn ? 'on' : 'off',
    toggleOn: lampOn,
    brightness: lightBrightness255,
    colorMode: 'brightness',
    supportedColorModes: ['brightness'],
    rawAttributes: {
      friendly_name: 'Luce salotto',
      supported_color_modes: ['brightness'],
      color_mode: 'brightness',
      brightness: lightBrightness255,
    },
  };

  const switchConsumption = switchOn ? 128 : 0;
  const switchEntity: MockEntityState = {
    state: switchOn ? 'on' : 'off',
    toggleOn: switchOn,
    rawAttributes: { device_class: 'outlet', friendly_name: 'Presa cucina', power: switchConsumption, power_unit: 'W' },
  };
  const switchConsumptionEntity: MockEntityState = {
    state: String(switchConsumption),
    numericValue: switchConsumption,
    unit: 'W',
  };
  const alarmEntity: MockEntityState = {
    state: alarmState,
    supportedFeatures: 63,
    rawAttributes: { changed_by: 'Mattia', code_arm_required: false },
  };
  const cameraEntity: MockEntityState = {
    state: cameraLive ? 'streaming' : 'idle',
    imageUrl: DEMO_ARTWORK,
    rawAttributes: { friendly_name: 'Ingresso', entity_picture: DEMO_ARTWORK },
  };
  const mediaEntity: MockEntityState = {
    state: mediaPlaying ? 'playing' : 'paused',
    stateLabel: mediaPlaying ? 'In riproduzione' : 'In pausa',
    progress: mediaProgress,
    mediaTitle: 'Lo-fi Focus',
    mediaArtist: 'Clima Master Radio',
    mediaDuration: MEDIA_DURATION_SECONDS,
    mediaPosition: Math.round((mediaProgress / 100) * MEDIA_DURATION_SECONDS),
    mediaPositionUpdatedAt: Date.now(),
    imageUrl: DEMO_ARTWORK,
  };
  const coverEntity: MockEntityState = {
    state: coverPosition <= 0 ? 'closed' : 'open',
    stateLabel: coverPosition <= 0 ? 'Chiusa' : 'Aperta',
    supportedFeatures: 15,
    rawAttributes: {
      friendly_name: 'Tenda soggiorno',
      current_position: coverPosition,
      supported_features: 15,
    },
  };

  return (
    <section
      id={SECTION_IDS.demo}
      className="relative z-10 overflow-hidden border-t border-white/5 bg-gradient-to-b from-transparent to-blue-900/5 px-4 py-16 md:px-8 md:py-32"
    >
      <div className="aurora left-[-8%] top-[30%] h-[32rem] w-[32rem] bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-3xl"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">Demo dal vivo</p>
          <h2 className="font-display text-3xl font-semibold text-white md:text-5xl">Card reali, dimensioni reali.</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/55">
            Non sono immagini: sono gli stessi componenti della dashboard, alle stesse proporzioni della griglia.
            Toccali per interagire.
          </p>
        </motion.div>

        {/* Live board */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel relative overflow-hidden rounded-[28px] p-4 shadow-2xl md:rounded-[36px] md:p-6"
        >
          {/* Board header */}
          <div className="mb-5 flex items-center justify-between gap-4 px-1">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-semibold text-white md:text-xl">Casa · anteprima live</h3>
              <p className="truncate text-sm text-white/45">
                Stai controllando: <span className="text-cyan-200/90">{CARD_LABEL[activeCard]}</span>
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70">
              <Radio className="h-3.5 w-3.5 text-emerald-400" />
              Demo
            </span>
          </div>

          {/* Grid mirrors the production engine: 48px row units, 16px gaps. */}
          <div className="grid grid-flow-row-dense auto-rows-[48px] grid-cols-2 gap-4 md:grid-cols-8">
            {CARD_ORDER.map((id) => {
              if (id === 'climate') {
                return (
                  <Cell key={id} id={id} activeCard={activeCard}>
                    <WidgetCardRenderer
                      widget={DEMO_WIDGETS.climate}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      onClick={() => select('climate')}
                      onClimatePowerToggle={() => {
                        select('climate');
                        actions.toggleClimatePower();
                      }}
                      onClimateTargetTempChange={(_, value) => {
                        select('climate');
                        actions.setClimateTarget(value);
                      }}
                      onClimateModeChange={(_, mode) => {
                        select('climate');
                        actions.setClimateMode(mode);
                      }}
                      onClimateFanModeChange={(_, mode) => {
                        select('climate');
                        actions.setClimateFanMode(mode);
                      }}
                      gridBreakpoint="lg"
                    />
                  </Cell>
                );
              }
              if (id === 'alarm') {
                return (
                  <Cell key={id} id={id} activeCard={activeCard}>
                    <WidgetCardRenderer
                      widget={DEMO_WIDGETS.alarm}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      onClick={() => select('alarm')}
                      onAlarmDisarm={() => {
                        select('alarm');
                        setAlarmState('disarmed');
                      }}
                      onAlarmArm={(_, mode) => {
                        select('alarm');
                        setAlarmState(mode === 'home' ? 'armed_home' : `armed_${mode}`);
                      }}
                      liveEntity={alarmEntity}
                      gridBreakpoint="lg"
                    />
                  </Cell>
                );
              }
              if (id === 'light') {
                return (
                  <Cell key={id} id={id} activeCard={activeCard} placement={lightPlacement}>
                    <WidgetCardRenderer
                      widget={DEMO_WIDGETS.light}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      onClick={() => {
                        select('light');
                        setLampOn((current) => !current);
                      }}
                      onLightBrightnessChange={(_, value) => {
                        select('light');
                        setLampBrightness(value);
                      }}
                      liveEntity={lightEntity}
                      gridBreakpoint="lg"
                    />
                  </Cell>
                );
              }
              if (id === 'switch') {
                return (
                  <Cell key={id} id={id} activeCard={activeCard} placement={switchPlacement}>
                    <WidgetCardRenderer
                      widget={DEMO_WIDGETS.switch}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      onClick={() => select('switch')}
                      onSwitchToggle={() => {
                        select('switch');
                        setSwitchOn((current) => !current);
                      }}
                      liveEntity={switchEntity}
                      switchConsumptionEntity={switchConsumptionEntity}
                      gridBreakpoint="lg"
                    />
                  </Cell>
                );
              }
              if (id === 'camera') {
                return (
                  <Cell key={id} id={id} activeCard={activeCard}>
                    <WidgetCardRenderer
                      widget={DEMO_WIDGETS.camera}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      onClick={() => {
                        select('camera');
                        setCameraLive((current) => !current);
                      }}
                      liveEntity={cameraEntity}
                      gridBreakpoint="lg"
                    />
                  </Cell>
                );
              }
              if (id === 'media') {
                return (
                  <Cell key={id} id={id} activeCard={activeCard}>
                    <WidgetCardRenderer
                      widget={DEMO_WIDGETS.media}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      onClick={() => select('media')}
                      onMediaToggle={() => {
                        select('media');
                        setMediaPlaying((current) => !current);
                      }}
                      onMediaSeek={(_, position) => {
                        select('media');
                        setMediaProgress(clamp(Math.round((position / MEDIA_DURATION_SECONDS) * 100), 0, 100));
                      }}
                      liveEntity={mediaEntity}
                      gridBreakpoint="lg"
                    />
                  </Cell>
                );
              }
              return (
                <Cell key={id} id={id} activeCard={activeCard}>
                  <WidgetCardRenderer
                    widget={DEMO_WIDGETS.cover}
                    dashboardState={state}
                    isEditMode={false}
                    isSelected={false}
                    onClick={() => select('cover')}
                    onCoverOpen={() => {
                      select('cover');
                      setCoverPosition(100);
                    }}
                    onCoverClose={() => {
                      select('cover');
                      setCoverPosition(0);
                    }}
                    onCoverPositionChange={(_, position) => {
                      select('cover');
                      setCoverPosition(clamp(Math.round(position), 0, 100));
                    }}
                    liveEntity={coverEntity}
                    gridBreakpoint="lg"
                  />
                </Cell>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
