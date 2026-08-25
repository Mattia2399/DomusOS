import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GlassSearchFilterBar from './GlassSearchFilterBar';

afterEach(cleanup);

const filters = [
  {
    id: 'type',
    label: 'Tipo',
    options: [
      { id: 'all', name: 'Tutti i tipi' },
      { id: 'light', name: 'Luci' },
    ],
    value: 'light',
    defaultValue: 'all',
    onChange: vi.fn(),
  },
];

describe('GlassSearchFilterBar', () => {
  it('supports search, clearing and active filter removal', () => {
    const onQueryChange = vi.fn();
    render(
      <GlassSearchFilterBar
        query="cucina"
        onQueryChange={onQueryChange}
        filters={filters}
        resultCount={3}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancella ricerca' }));
    expect(onQueryChange).toHaveBeenCalledWith('');

    fireEvent.click(screen.getByRole('button', { name: 'Rimuovi filtro Tipo' }));
    expect(filters[0].onChange).toHaveBeenCalledWith('all');
    expect(screen.getByText('3 risultati')).toBeTruthy();
  });

  it('opens the compact filter sheet and exposes the result action', () => {
    render(
      <GlassSearchFilterBar
        query=""
        onQueryChange={vi.fn()}
        filters={filters}
        resultCount={12}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filtri, 1 attivi' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Filtri' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '12 risultati' })).toBeTruthy();
  });

  it('works as a compact search-only control without exposing empty filters', () => {
    render(
      <GlassSearchFilterBar
        query=""
        onQueryChange={vi.fn()}
        filters={[]}
        resultCount={5}
        onReset={vi.fn()}
        placeholder="Cerca una card"
      />,
    );

    expect(screen.getByRole('searchbox', { name: 'Cerca una card' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apri filtri' })).toBeNull();
    expect(screen.getByText('5 risultati')).toBeTruthy();
  });
});
