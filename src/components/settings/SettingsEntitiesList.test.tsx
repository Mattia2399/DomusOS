import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SettingsEntitiesList from './SettingsEntitiesList';

afterEach(cleanup);

const states = {
  'light.cucina': {
    state: 'on',
    rawAttributes: { friendly_name: 'Luce cucina' },
  },
  'sensor.temperatura': {
    state: '21.5',
    unit: '°C',
    rawAttributes: { friendly_name: 'Temperatura' },
  },
  'lock.porta': {
    state: 'unavailable',
    rawAttributes: { friendly_name: 'Porta ingresso' },
  },
};

describe('SettingsEntitiesList', () => {
  it('shows every Home Assistant entity with its identifier and state', () => {
    render(<SettingsEntitiesList haStates={states} />);

    expect(screen.getByText('Luce cucina')).toBeTruthy();
    expect(screen.getByText('light.cucina')).toBeTruthy();
    expect(screen.getByText('21.5 °C')).toBeTruthy();
    expect(screen.getByText('Non disponibile')).toBeTruthy();
  });

  it('filters entities using the search field', () => {
    render(<SettingsEntitiesList haStates={states} />);

    fireEvent.change(screen.getByPlaceholderText('Cerca per nome, ID o stato'), {
      target: { value: 'temperatura' },
    });

    expect(screen.getByText('Temperatura')).toBeTruthy();
    expect(screen.queryByText('Luce cucina')).toBeNull();
    expect(screen.getByText('1 entità')).toBeTruthy();
  });

  it('includes registry entities without a live state', () => {
    render(
      <SettingsEntitiesList
        haStates={states}
        entityRegistry={[
          {
            entityId: 'switch.irrigazione',
            name: 'Irrigazione',
            disabledBy: 'user',
            areaId: 'giardino',
          },
        ]}
        areas={[{ area_id: 'giardino', name: 'Giardino' }]}
      />,
    );

    expect(screen.getByText('Irrigazione')).toBeTruthy();
    expect(screen.getByText('switch.irrigazione')).toBeTruthy();
    expect(screen.getByText('Disabilitata')).toBeTruthy();
    expect(screen.getByText('Interruttori · Giardino')).toBeTruthy();
    expect(screen.getByText('4 entità')).toBeTruthy();
  });
});
