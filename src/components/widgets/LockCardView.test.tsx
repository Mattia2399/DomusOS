import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LockCardView } from './LockCardView';
import type { LockCardModel } from './lockCardModel';

const baseModel: LockCardModel = {
  title: 'Porta ingresso',
  state: 'locked',
  stateLabel: 'Bloccata',
  compactStateLabel: 'Protetta',
  caption: 'Accesso protetto',
  hint: 'Tieni premuto per sbloccare',
  supportsOpen: false,
  isLocked: true,
  isUnlocked: false,
  isOpen: false,
  isJammed: false,
  isTransitioning: false,
  isUnavailable: false,
  primaryAction: 'unlock',
  primaryActionLabel: 'Sblocca',
  primaryActionHint: 'Scorri per sbloccare',
  tone: 'secure',
};

const handlers = {
  onOpen: vi.fn(),
  onPrimaryAction: vi.fn(),
  onStartHold: vi.fn(),
  onEndHold: vi.fn(),
  onResetHold: vi.fn(),
};

describe('LockCardView presentation', () => {
  afterEach(cleanup);

  it('keeps battery and connection telemetry out of the card', () => {
    const { queryByLabelText, queryByText } = render(
      <LockCardView
        {...handlers}
        model={baseModel}
        layoutVariant="full"
        isSelected={false}
        isEditMode={false}
        holdProgress={0}
        isHolding={false}
        isSuccessPulse={false}
      />,
    );

    expect(queryByLabelText(/Batteria/i)).toBeNull();
    expect(queryByLabelText(/Connessione/i)).toBeNull();
    expect(queryByText(/^Batteria$/i)).toBeNull();
    expect(queryByText(/^(ND|n\/d)$/i)).toBeNull();
  });
});
