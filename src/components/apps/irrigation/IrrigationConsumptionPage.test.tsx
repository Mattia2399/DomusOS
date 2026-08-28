import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IrrigationConsumptionPage from './IrrigationConsumptionPage';

afterEach(() => cleanup());

const baseProps = {
  period: '7d' as const,
  onPeriodChange: vi.fn(),
  status: 'available' as const,
  totalLiters: 125,
  dailyAverageLiters: 17.9,
  comparisonPct: -14,
  points: [
    { key: 'one', label: 'Lu', value: 45 },
    { key: 'two', label: 'Ma', value: 80 },
  ],
  zones: [{ id: 'north', name: 'Prato Nord', liters: 75, share: 60, plannedMinutes: 45 }],
  configuredZones: 1,
  plannedMinutes: 45,
  dataSourceLabel: 'Storico Home Assistant',
  isEstimatedBreakdown: true,
  onOpenSettings: vi.fn(),
  onManageZones: vi.fn(),
};

describe('IrrigationConsumptionPage', () => {
  it('shows real summaries, the chart and the estimated zone disclosure', () => {
    render(<IrrigationConsumptionPage {...baseProps} />);
    expect(screen.getByText('Seleziona il periodo da analizzare')).toBeTruthy();
    expect(screen.getByLabelText('Grafico consumi irrigazione')).toBeTruthy();
    expect(screen.getByText('Prato Nord')).toBeTruthy();
    expect(screen.getByText(/Stima proporzionale/)).toBeTruthy();
  });

  it('changes period through the shared segmented control', () => {
    const onPeriodChange = vi.fn();
    render(<IrrigationConsumptionPage {...baseProps} onPeriodChange={onPeriodChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '30 giorni' }));
    expect(onPeriodChange).toHaveBeenCalledWith('30d');
  });

  it('does not expose configuration actions without authorization', () => {
    render(<IrrigationConsumptionPage {...baseProps} status="empty" points={[]} totalLiters={null} onOpenSettings={undefined} onManageZones={undefined} />);
    expect(screen.queryByRole('button', { name: /Configura contatore/ })).toBeNull();
    expect(screen.getByText('Gestite da Owner e Admin')).toBeTruthy();
  });

  it('distinguishes missing history from a missing counter configuration', () => {
    render(<IrrigationConsumptionPage {...baseProps} status="insufficient" points={[]} totalLiters={null} />);
    expect(screen.getByText('Storico non ancora sufficiente')).toBeTruthy();
    expect(screen.queryByText('Collega un contatore dell’acqua')).toBeNull();
  });

  it('uses stable skeletons instead of N/D while the first period is loading', () => {
    render(
      <IrrigationConsumptionPage
        {...baseProps}
        status="loading"
        points={[]}
        totalLiters={null}
        dailyAverageLiters={null}
        comparisonPct={null}
      />,
    );
    expect(screen.getAllByLabelText('Caricamento valore')).toHaveLength(3);
    expect(screen.getByLabelText('Caricamento grafico consumi')).toBeTruthy();
  });
});
