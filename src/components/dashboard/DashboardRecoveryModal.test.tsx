import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardRecoveryModal } from './DashboardRecoveryModal';

describe('DashboardRecoveryModal', () => {
  afterEach(cleanup);

  it('requires an explicit choice between current and recovery layouts', () => {
    const onKeepCurrent = vi.fn();
    const onRestore = vi.fn();
    const { getByRole } = render(
      <DashboardRecoveryModal
        snapshot={{ runtimeMode: 'real', createdAt: Date.now() }}
        onKeepCurrent={onKeepCurrent}
        onRestore={onRestore}
      />,
    );

    expect(getByRole('dialog').textContent).toContain('Copia di recupero disponibile');
    fireEvent.click(getByRole('button', { name: /Mantieni attuale/i }));
    fireEvent.click(getByRole('button', { name: /Ripristina copia/i }));
    expect(onKeepCurrent).toHaveBeenCalledOnce();
    expect(onRestore).toHaveBeenCalledOnce();
  });
});
