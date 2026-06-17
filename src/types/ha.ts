export type ExternalWidgetKind =
  | 'spacer'
  | 'navbar'
  | 'sidebar'
  | 'vertical-stack'
  | 'horizontal-stack'
  | 'page-navigator'
  | 'title'
  | 'subtitle'
  | 'divider'
  | 'chip'
  | 'time'
  | 'metric'
  | 'light'
  | 'switch'
  | 'climate'
  | 'weather'
  | 'media'
  | 'camera'
  | 'scene';

export interface ExternalGridPos {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ExternalWidgetStyle {
  accent: string;
  background: string;
  radius: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
  italic: boolean;
  letterSpacing: number;
}

export interface ExternalNavbarItem {
  label: string;
  path: string;
  icon?: string;
  iconPath?: string;
}

export interface ExternalWidgetConfig {
  subtitle?: string;
  parentStackId?: string;
  stackOrder?: number;
  stackGap?: number;
  stackColumns?: number;
  navPosition?: 'bottom' | 'left' | 'right';
  navVariant?: 'dock' | 'sidebar';
  navItems?: ExternalNavbarItem[];
  activeNavIndex?: number;
  showLabels?: boolean;
  navScale?: number;
  sidebarWidth?: number;
  sidebarShowHeader?: boolean;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  eyebrow?: string;
  showCardBackground?: boolean;
  pageNavLayout?: 'pill' | 'list';
  pageNavShowIcons?: boolean;
  pageNavShowLabels?: boolean;
  pageNavShowPath?: boolean;
  stickyTop?: boolean;
  useTimeGreeting?: boolean;
  greetingName?: string;
  greetingSuffix?: string;
  timePreset?: 'digital' | 'minimal' | 'editorial';
  timeFormat?: '24h' | '12h';
  dateFormat?: 'short' | 'medium' | 'long' | 'weekday-short' | 'weekday-long';
  showDate?: boolean;
  weatherLayout?: 'card' | 'chip' | 'forecast';
  weatherForecastType?: 'daily' | 'hourly' | 'twice_daily';
  weatherShowCondition?: boolean;
  weatherShowPrecipitation?: boolean;
  weatherShowWind?: boolean;
  forecastDays?: number;
  forecastDensity?: 'compact' | 'extended';
  unit?: string;
  decimals?: number;
  actionLabel?: string;
  cameraUrl?: string;
  cameraLabel?: string;
  min?: number;
  max?: number;
  currentValue?: number;
  targetValue?: number;
  targetTempLow?: number;
  targetTempHigh?: number;
  targetTempStep?: number;
  progress?: number;
  brightness?: number;
  toggleOn?: boolean;
  stateLabel?: string;
  chipValue?: string;
  chipIcon?: string;
  chipIconPath?: string;
  showChipIcon?: boolean;
  nowPlaying?: string;
  hvacMode?: string;
  hvacModes?: string[];
  fanMode?: string;
  fanModes?: string[];
  volumeLevel?: number;
  mediaMuted?: boolean;
}

export interface MockWeatherForecastEntry {
  datetime?: string;
  isDaytime?: boolean;
  condition?: string;
  apparentTemperature?: number;
  cloudCoverage?: number;
  dewPoint?: number;
  humidity?: number;
  pressure?: number;
  temperature?: number;
  templow?: number;
  uvIndex?: number;
  windBearing?: number | string;
  windGustSpeed?: number;
  precipitation?: number;
  precipitationProbability?: number;
  windSpeed?: number;
}

export interface ExternalWidget {
  id: string;
  kind: ExternalWidgetKind;
  title: string;
  entityId: string;
  grid: ExternalGridPos;
  style: ExternalWidgetStyle;
  config: ExternalWidgetConfig;
}

export interface ExternalDashboardPage {
  id: string;
  name: string;
  path: string;
  widgets: ExternalWidget[];
}

export interface ExternalDashboardTheme {
  canvasBackground: string;
  shellBackground: string;
  textColor: string;
  mutedTextColor: string;
  cardShadow: string;
}

export interface ExternalDashboardProject {
  id: string;
  name: string;
  description: string;
  pages: ExternalDashboardPage[];
  theme: ExternalDashboardTheme;
}

export interface MockEntityState {
  state: string;
  secondary?: string;
  numericValue?: number;
  imageUrl?: string;
  supportedFeatures?: number;
  rawAttributes?: Record<string, unknown>;
  unit?: string;
  targetValue?: number;
  currentValue?: number;
  brightness?: number;
  toggleOn?: boolean;
  progress?: number;
  stateLabel?: string;
  nowPlaying?: string;
  mediaTitle?: string;
  mediaArtist?: string;
  mediaPosition?: number;
  mediaDuration?: number;
  mediaPositionUpdatedAt?: number;
  shuffleEnabled?: boolean;
  repeatMode?: 'off' | 'all' | 'one' | string;
  forecast?: MockWeatherForecastEntry[];
  precipitation?: number;
  windSpeed?: number;
  humidity?: number;
  hvacMode?: string;
  hvacModes?: string[];
  hvacAction?: string;
  minTemp?: number;
  maxTemp?: number;
  targetTempStep?: number;
  targetTempLow?: number;
  targetTempHigh?: number;
  fanMode?: string;
  fanModes?: string[];
  volumeLevel?: number;
  mediaMuted?: boolean;
  colorMode?: string;
  hsColor?: [number, number];
  rgbColor?: [number, number, number];
  colorTempKelvin?: number;
  color_mode?: string;
  hs_color?: [number, number];
  rgb_color?: [number, number, number];
  color_temp_kelvin?: number;
}

export type MockEntityStateMap = Record<string, MockEntityState>;
