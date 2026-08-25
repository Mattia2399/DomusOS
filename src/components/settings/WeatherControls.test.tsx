import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import { WeatherControlsPanel } from './WeatherControls';

function buildWeather(
  patch: Partial<DashboardStateShape['weather']> = {},
): DashboardStateShape['weather'] {
  return {
    available: true,
    source: 'ha',
    location: 'Casa',
    condition: 'sunny',
    temperature: 24,
    feelsLike: 24,
    high: 27,
    low: 18,
    precipitation: 0,
    precipitationAmount: 0,
    pressure: 1018,
    dewPoint: 12,
    cloudCoverage: 5,
    windGustSpeed: 12,
    windBearing: 180,
    humidity: 45,
    windSpeed: 7,
    uvIndex: 4,
    visibility: 30,
    forecast: [],
    ...patch,
  };
}

describe('WeatherControlsPanel data truth', () => {
  afterEach(cleanup);

  it('does not synthesize forecast slots when Home Assistant returns none', () => {
    render(<WeatherControlsPanel weather={buildWeather()} forecastDays={5} />);

    expect(screen.getByText('PREVISIONI NON DISPONIBILI')).toBeTruthy();
    expect(screen.getByText('Home Assistant non ha restituito previsioni per questa entità.')).toBeTruthy();
    expect(screen.queryByText('Oggi')).toBeNull();
  });

  it('explains how to configure weather when no entity is available', () => {
    render(
      <WeatherControlsPanel
        weather={buildWeather({
          available: false,
          source: 'unavailable',
          location: 'Meteo non configurato',
          condition: 'unavailable',
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Meteo non configurato' })).toBeTruthy();
    expect(screen.getByText(/Seleziona un’entità weather/)).toBeTruthy();
  });
});
