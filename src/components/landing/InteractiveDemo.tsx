import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Camera, Lightbulb, Lock, Power, ShieldAlert, Thermometer, Zap } from 'lucide-react';
import { useDashboardState } from '../../hooks/useDashboardState';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { WidgetCardRenderer } from '../widgets/CardRenderer';

type DemoCardId = 'climate' | 'light' | 'switch' | 'sensor' | 'alarm' | 'camera' | 'lock';

type DemoFrameProps = {
  id: DemoCardId;
  title: string;
  variant: string;
  icon: ReactNode;
  className: string;
  activeCard: DemoCardId;
  children: ReactNode;
};

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
    layout: { i: 'climate.air_conditioner', x: 0, y: 0, w: 2, h: 4 },
  },
  light: {
    id: 'light.living_room_lamp',
    kind: 'light',
    title: 'Luce salotto',
    entityId: 'light.living_room_lamp',
    status: 'on',
    isOn: true,
    value: 68,
    unit: '%',
    layout: { i: 'light.living_room_lamp', x: 2, y: 0, w: 3, h: 3 },
  },
  switch: {
    id: 'landing.switch.compact',
    kind: 'switch',
    title: 'Presa cucina',
    entityId: 'switch.kitchen_outlet',
    status: 'on',
    isOn: true,
    switchConsumptionEntityId: 'sensor.kitchen_outlet_power',
    layout: { i: 'landing.switch.compact', x: 5, y: 0, w: 2, h: 1 },
  },
  sensor: {
    id: 'landing.sensor.standard',
    kind: 'sensor',
    title: 'Energia',
    entityId: 'sensor.living_room_power',
    status: 'tracking',
    isOn: true,
    value: 420,
    unit: 'W',
    sensorDisplayPrecision: 0,
    layout: { i: 'landing.sensor.standard', x: 7, y: 0, w: 2, h: 2 },
  },
  alarm: {
    id: 'landing.alarm.standard',
    kind: 'alarm',
    title: 'Allarme Casa',
    entityId: 'alarm_control_panel.home_alarm',
    status: 'armed_home',
    isOn: true,
    alarmRequireAuthToDisarm: true,
    layout: { i: 'landing.alarm.standard', x: 0, y: 4, w: 2, h: 3 },
  },
  camera: {
    id: 'landing.camera',
    kind: 'camera',
    title: 'Camera ingresso',
    entityId: 'camera.front_door',
    status: 'streaming',
    isOn: true,
    layout: { i: 'landing.camera', x: 2, y: 4, w: 3, h: 3 },
  },
  lock: {
    id: 'landing.lock.compact',
    kind: 'lock',
    title: 'Porta ingresso',
    entityId: 'lock.front_door',
    status: 'unlocked',
    isOn: true,
    lockRequireAuthToUnlock: true,
    layout: { i: 'landing.lock.compact', x: 5, y: 4, w: 2, h: 2 },
  },
} satisfies Record<DemoCardId, Widget>;

const SENSOR_HISTORY = [320, 348, 336, 392, 410, 384, 420];

function DemoFrame({
  id,
  title,
  variant,
  icon,
  className,
  activeCard,
  children,
}: DemoFrameProps) {
  const isActive = activeCard === id;

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`min-w-0 ${className}`}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-cyan-200">
            {icon}
          </span>
          <span className="truncate text-sm font-medium text-white/82">{title}</span>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-white/45">
          {variant}
        </span>
      </div>

      <div
        className={`relative h-[calc(100%-2.25rem)] min-h-0 min-w-0 rounded-[2rem] transition ${
          isActive ? 'ring-1 ring-cyan-200/50 ring-offset-2 ring-offset-[#05070d]' : ''
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export const InteractiveDemo = () => {
  const { state, actions } = useDashboardState();
  const [activeCard, setActiveCard] = useState<DemoCardId>('climate');
  const [switchOn, setSwitchOn] = useState(true);
  const [sensorValue, setSensorValue] = useState(420);
  const [sensorHistory, setSensorHistory] = useState(SENSOR_HISTORY);
  const [alarmState, setAlarmState] = useState('armed_home');
  const [cameraLive, setCameraLive] = useState(true);
  const [lockState, setLockState] = useState<'locked' | 'unlocked' | 'open'>('unlocked');

  const selectCard = (id: DemoCardId) => setActiveCard(id);

  const switchConsumption = switchOn ? 128 : 0;
  const switchEntity: MockEntityState = {
    state: switchOn ? 'on' : 'off',
    toggleOn: switchOn,
    rawAttributes: {
      device_class: 'outlet',
      friendly_name: 'Presa cucina',
      power: switchConsumption,
      power_unit: 'W',
    },
  };
  const switchConsumptionEntity: MockEntityState = {
    state: String(switchConsumption),
    numericValue: switchConsumption,
    unit: 'W',
  };
  const sensorEntity: MockEntityState = {
    state: String(sensorValue),
    numericValue: sensorValue,
    unit: 'W',
    rawAttributes: {
      device_class: 'power',
      min: 0,
      max: 900,
    },
  };
  const alarmEntity: MockEntityState = {
    state: alarmState,
    supportedFeatures: 63,
    rawAttributes: {
      changed_by: 'Mattia',
      code_arm_required: false,
    },
  };
  const cameraEntity: MockEntityState = {
    state: cameraLive ? 'streaming' : 'offline',
    imageUrl: '/wallpapers/apple-home-hub.webp',
    rawAttributes: {
      friendly_name: 'Camera ingresso',
      entity_picture: '/wallpapers/apple-home-hub.webp',
    },
  };
  const lockEntity: MockEntityState = {
    state: lockState,
    supportedFeatures: 1,
    rawAttributes: {
      battery_level: 84,
      changed_by: lockState === 'locked' ? 'Auto-lock' : 'Mattia',
    },
  };

  const toggleSwitch = () => {
    selectCard('switch');
    setSwitchOn((current) => !current);
  };

  const updateSensor = () => {
    selectCard('sensor');
    const nextValue = sensorValue >= 760 ? 410 : sensorValue + 38;
    setSensorValue(nextValue);
    setSensorHistory((current) => [...current.slice(-7), nextValue]);
  };

  const toggleAlarm = () => {
    selectCard('alarm');
    setAlarmState((current) => (current === 'disarmed' ? 'armed_home' : 'disarmed'));
  };

  const toggleLock = () => {
    selectCard('lock');
    setLockState((current) => (current === 'locked' ? 'unlocked' : 'locked'));
    return true;
  };

  return (
    <section id="demo" className="relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-900/5 px-4 py-24 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
            Demo card
          </p>
          <h2 className="text-3xl font-semibold text-white md:text-5xl">Card reali, varianti reali.</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/54">
            La preview usa gli stessi componenti della dashboard: controlli, stati live e layout responsive in un unico punto.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
          <DemoFrame
            id="climate"
            title="Climate"
            variant="completa"
            icon={<Thermometer size={15} />}
            className="h-[18.5rem] md:col-span-3 lg:col-span-4"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.climate}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={() => selectCard('climate')}
              onClimatePowerToggle={() => {
                selectCard('climate');
                actions.toggleClimatePower();
              }}
              onClimateTargetTempChange={(_, value) => {
                selectCard('climate');
                actions.setClimateTarget(value);
              }}
              onClimateTargetRangeChange={(_, low, high) => {
                selectCard('climate');
                actions.setClimateTargetRange(low, high);
              }}
              onClimateTargetHumidityChange={(_, value) => {
                selectCard('climate');
                actions.setClimateTargetHumidity(value);
              }}
              onClimateModeChange={(_, mode) => {
                selectCard('climate');
                actions.setClimateMode(mode);
              }}
              onClimateFanModeChange={(_, mode) => {
                selectCard('climate');
                actions.setClimateFanMode(mode);
              }}
              onClimatePresetModeChange={(_, mode) => {
                selectCard('climate');
                actions.setClimatePresetMode(mode);
              }}
              onClimateSwingModeChange={(_, mode) => {
                selectCard('climate');
                actions.setClimateSwingMode(mode);
              }}
              onClimateSwingHorizontalModeChange={(_, mode) => {
                selectCard('climate');
                actions.setClimateSwingHorizontalMode(mode);
              }}
              gridBreakpoint="lg"
            />
          </DemoFrame>

          <DemoFrame
            id="light"
            title="Light"
            variant="espandibile"
            icon={<Lightbulb size={15} />}
            className="h-[14rem] md:col-span-3 lg:col-span-4"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.light}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={() => {
                selectCard('light');
                actions.toggleLamp();
              }}
              onLightBrightnessChange={(_, value) => {
                selectCard('light');
                actions.setLampBrightness(value);
              }}
              onLightColorChange={(_, hs) => {
                selectCard('light');
                actions.setLampHsColor(hs);
              }}
              gridBreakpoint="lg"
            />
          </DemoFrame>

          <DemoFrame
            id="camera"
            title="Camera"
            variant="contestuale"
            icon={<Camera size={15} />}
            className="h-[18.5rem] md:col-span-6 lg:col-span-4"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.camera}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={() => {
                selectCard('camera');
                setCameraLive((current) => !current);
              }}
              liveEntity={cameraEntity}
              gridBreakpoint="lg"
            />
          </DemoFrame>

          <DemoFrame
            id="alarm"
            title="Alarm"
            variant="standard"
            icon={<ShieldAlert size={15} />}
            className="h-[13.25rem] md:col-span-3 lg:col-span-4"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.alarm}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={toggleAlarm}
              onAlarmDisarm={() => {
                selectCard('alarm');
                setAlarmState('disarmed');
              }}
              onAlarmArm={(_, mode) => {
                selectCard('alarm');
                setAlarmState(mode === 'home' ? 'armed_home' : `armed_${mode}`);
              }}
              liveEntity={alarmEntity}
              gridBreakpoint="lg"
            />
          </DemoFrame>

          <DemoFrame
            id="sensor"
            title="Sensor"
            variant="standard"
            icon={<Zap size={15} />}
            className="mx-auto h-[10.5rem] w-full max-w-[15rem] md:col-span-3 lg:col-span-2"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.sensor}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              value={sensorValue}
              sensorHistory={sensorHistory}
              onClick={updateSensor}
              liveEntity={sensorEntity}
              gridBreakpoint="lg"
            />
          </DemoFrame>

          <DemoFrame
            id="switch"
            title="Switch"
            variant="compact"
            icon={<Power size={15} />}
            className="h-[7rem] md:col-span-3 lg:col-span-3"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.switch}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={() => selectCard('switch')}
              onSwitchToggle={toggleSwitch}
              liveEntity={switchEntity}
              switchConsumptionEntity={switchConsumptionEntity}
              gridBreakpoint="lg"
            />
          </DemoFrame>

          <DemoFrame
            id="lock"
            title="Lock"
            variant="compact"
            icon={<Lock size={15} />}
            className="h-[8.5rem] md:col-span-3 lg:col-span-3"
            activeCard={activeCard}
          >
            <WidgetCardRenderer
              widget={DEMO_WIDGETS.lock}
              dashboardState={state}
              isEditMode={false}
              isSelected={false}
              onClick={toggleLock}
              onLockToggle={toggleLock}
              onLockOpen={() => {
                selectCard('lock');
                setLockState('open');
              }}
              liveEntity={lockEntity}
              gridBreakpoint="lg"
            />
          </DemoFrame>
        </div>
      </div>
    </section>
  );
};
