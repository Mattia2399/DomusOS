import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SecurityAuthModal } from './SecurityAuthModal';

const baseProps = {
  isOpen: true,
  pendingAlarmState: 'armed_away',
  pendingStateRequiresCode: true,
  isAlarmCodeNumeric: true,
  alarmCodeTypeLabel: 'PIN allarme',
  authPinInput: '',
  onPinInputChange: vi.fn(),
  onVerifyWithPin: vi.fn(),
  onPushPinDigit: vi.fn(),
  onPopPinDigit: vi.fn(),
  onClearPin: vi.fn(),
  onClose: vi.fn(),
};

describe('SecurityAuthModal safety messaging', () => {
  afterEach(cleanup);

  it('does not show invalid-code feedback before a submitted attempt', () => {
    const { queryByText } = render(<SecurityAuthModal {...baseProps} />);

    expect(queryByText(/non valido|impossibile autorizzare/i)).toBeNull();
  });

  it('shows auth errors only when the parent reports a failed verification', () => {
    const onVerifyWithPin = vi.fn();
    const { getByRole, queryByText, rerender } = render(
      <SecurityAuthModal {...baseProps} onVerifyWithPin={onVerifyWithPin} />,
    );

    fireEvent.click(getByRole('button', { name: 'Conferma' }));
    expect(onVerifyWithPin).toHaveBeenCalledOnce();
    expect(queryByText('Impossibile autorizzare il comando.')).toBeNull();

    rerender(
      <SecurityAuthModal
        {...baseProps}
        onVerifyWithPin={onVerifyWithPin}
        authError="Impossibile autorizzare il comando."
      />,
    );
    expect(queryByText('Impossibile autorizzare il comando.')).not.toBeNull();
  });
});
