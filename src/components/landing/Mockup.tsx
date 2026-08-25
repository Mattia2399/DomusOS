import { motion } from 'framer-motion';
import { WidgetCardRenderer } from '../widgets/CardRenderer';
import { useDashboardState } from '../../hooks/useDashboardState';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';

/**
 * Hero preview board.
 *
 * Rendered at the production grid geometry (48px row units, 16px gaps) so every
 * card keeps its real aspect ratio instead of being stretched. The five cards
 * tile a 6×5 board with zero gaps on desktop and reflow into a tidy 2-column
 * stack on mobile.
 */

const previewWidgets = {
  alarm: {
    id: 'landing.alarm',
    kind: 'alarm',
    title: 'EZVIZ Alarm',
    entityId: 'alarm_control_panel.home_alarm',
    status: 'armed_home',
    isOn: true,
    alarmRequireAuthToDisarm: true,
    layout: { i: 'landing.alarm', x: 0, y: 0, w: 3, h: 3 },
  },
  climate: {
    id: 'climate.air_conditioner',
    kind: 'climate',
    title: 'Clima soggiorno',
    entityId: 'climate.air_conditioner',
    status: 'heat',
    isOn: true,
    value: 22,
    unit: 'C',
    layout: { i: 'climate.air_conditioner', x: 3, y: 0, w: 3, h: 3 },
  },
  light: {
    id: 'light.living_room_lamp',
    kind: 'light',
    title: 'Luce salotto',
    entityId: 'light.living_room_lamp',
    status: 'on',
    isOn: true,
    value: 72,
    unit: '%',
    layout: { i: 'light.living_room_lamp', x: 0, y: 3, w: 2, h: 2 },
  },
  sensor: {
    id: 'landing.energy',
    kind: 'sensor',
    title: 'Energia',
    entityId: 'sensor.living_room_power',
    status: 'tracking',
    isOn: true,
    value: 420,
    unit: 'W',
    sensorDisplayPrecision: 0,
    layout: { i: 'landing.energy', x: 2, y: 3, w: 2, h: 2 },
  },
  lock: {
    id: 'landing.lock',
    kind: 'lock',
    title: 'Porta ingresso',
    entityId: 'lock.front_door',
    status: 'locked',
    isOn: true,
    lockRequireAuthToUnlock: true,
    layout: { i: 'landing.lock', x: 4, y: 3, w: 2, h: 2 },
  },
} satisfies Record<string, Widget>;

const previewEntities: Record<string, MockEntityState> = {
  alarm: {
    state: 'armed_home',
    supportedFeatures: 63,
    rawAttributes: {
      changed_by: 'Mattia',
      code_arm_required: false,
    },
  },
  light: {
    state: 'on',
    brightness: 184,
    hsColor: [44, 88],
    colorTempKelvin: 3200,
    supportedColorModes: ['brightness', 'hs', 'color_temp'],
    rawAttributes: {
      friendly_name: 'Luce salotto',
      supported_color_modes: ['brightness', 'hs', 'color_temp'],
      brightness: 184,
      hs_color: [44, 88],
      color_temp_kelvin: 3200,
    },
  },
  sensor: {
    state: '420',
    numericValue: 420,
    unit: 'W',
    rawAttributes: {
      device_class: 'power',
      min: 0,
      max: 900,
    },
  },
  lock: {
    state: 'locked',
    supportedFeatures: 1,
    rawAttributes: {
      battery_level: 84,
      changed_by: 'Auto-lock',
    },
  },
  climate: {
    state: 'heat',
    stateLabel: 'Riscaldamento',
    currentValue: 21.5,
    targetValue: 22.5,
    hvacMode: 'heat',
    hvacAction: 'heating',
    hvacModes: ['off', 'heat', 'cool', 'auto', 'dry'],
    fanMode: 'auto',
    fanModes: ['auto', '1', '2', '3'],
    currentHumidity: 48,
    targetHumidity: 45,
    minTemp: 16,
    maxTemp: 30,
    targetTempStep: 0.5,
    supportedFeatures: 1023,
    rawAttributes: {
      friendly_name: 'Clima soggiorno',
      hvac_mode: 'heat',
      hvac_action: 'heating',
      hvac_modes: ['off', 'heat', 'cool', 'auto', 'dry'],
      fan_mode: 'auto',
      fan_modes: ['auto', '1', '2', '3'],
      current_temperature: 21.5,
      temperature: 22.5,
      target_temp_step: 0.5,
      min_temp: 16,
      max_temp: 30,
      temperature_unit: '°C',
      current_humidity: 48,
      humidity: 45,
      supported_features: 1023,
    },
  },
};

const sensorHistory = [320, 348, 336, 392, 410, 384, 420];

/** Explicit placement per card. Base = 2-col mobile stack; md = gapless 6×5 board. */
const PLACEMENT = {
  alarm: 'col-span-2 row-span-3 md:col-start-1 md:col-span-3 md:row-start-1 md:row-span-3',
  climate: 'col-span-2 row-span-3 md:col-start-4 md:col-span-3 md:row-start-1 md:row-span-3',
  light: 'col-span-1 row-span-2 md:col-start-1 md:col-span-2 md:row-start-4 md:row-span-2',
  sensor: 'col-span-1 row-span-2 md:col-start-3 md:col-span-2 md:row-start-4 md:row-span-2',
  lock: 'col-span-2 row-span-2 md:col-start-5 md:col-span-2 md:row-start-4 md:row-span-2',
} as const;

function Cell({ area, children }: { area: keyof typeof PLACEMENT; children: React.ReactNode }) {
  return <div className={`min-h-0 min-w-0 ${PLACEMENT[area]}`}>{children}</div>;
}

export const DashboardMockup = () => {
  const { state, actions } = useDashboardState();
  const openCard = () => undefined;

  return (
    <div className="perspective-1000 relative mx-auto mt-20 w-full max-w-6xl">
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-emerald-500/16 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="glass-panel relative overflow-hidden rounded-t-3xl border-b-0 border-white/10 p-4 shadow-2xl md:rounded-3xl md:border-b md:p-7"
      >
        <div className="relative z-10 mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-semibold text-white">Buongiorno, Mattia</h3>
            <p className="truncate text-sm text-white/50">Casa · dashboard live</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/70 backdrop-blur-md">
            M
          </div>
        </div>

        <div className="relative z-10 grid grid-flow-row-dense auto-rows-[48px] grid-cols-2 gap-4 md:grid-cols-6">
          <Cell area="alarm">
            <WidgetCardRenderer
              widget={previewWidgets.alarm}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={openCard}
              onAlarmDisarm={openCard}
              onAlarmArm={openCard}
              liveEntity={previewEntities.alarm}
              gridBreakpoint="lg"
            />
          </Cell>

          <Cell area="climate">
            <WidgetCardRenderer
              widget={previewWidgets.climate}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={openCard}
              onClimateTargetTempChange={(_, value) => actions.setClimateTarget(value)}
              onClimateModeChange={(_, mode) => actions.setClimateMode(mode)}
              onClimateFanModeChange={(_, mode) => actions.setClimateFanMode(mode)}
              liveEntity={previewEntities.climate}
              gridBreakpoint="lg"
            />
          </Cell>

          <Cell area="light">
            <WidgetCardRenderer
              widget={previewWidgets.light}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={actions.toggleLamp}
              onLightBrightnessChange={(_, value) => actions.setLampBrightness(value)}
              onLightColorChange={(_, hs) => actions.setLampHsColor(hs)}
              liveEntity={previewEntities.light}
              gridBreakpoint="lg"
            />
          </Cell>

          <Cell area="sensor">
            <WidgetCardRenderer
              widget={previewWidgets.sensor}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              value={420}
              sensorHistory={sensorHistory}
              onClick={openCard}
              liveEntity={previewEntities.sensor}
              gridBreakpoint="lg"
            />
          </Cell>

          <Cell area="lock">
            <WidgetCardRenderer
              widget={previewWidgets.lock}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={openCard}
              onLockToggle={openCard}
              onLockOpen={openCard}
              liveEntity={previewEntities.lock}
              gridBreakpoint="lg"
            />
          </Cell>
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </motion.div>
    </div>
  );
};
