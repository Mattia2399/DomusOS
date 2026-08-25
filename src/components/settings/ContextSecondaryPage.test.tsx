import { fireEvent, render } from '@testing-library/react';
import { Settings2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ContextSecondaryPage } from './ContextSecondaryPage';

describe('ContextSecondaryPage', () => {
  it('uses a single back action and never renders a close action', () => {
    const onBack = vi.fn();
    const { getByRole, queryByRole } = render(
      <ContextSecondaryPage
        title="Impostazioni dispositivo"
        subtitle="Controlli associati"
        backLabel="Dispositivo"
        icon={<Settings2 />}
        onBack={onBack}
      >
        <p>Contenuto</p>
      </ContextSecondaryPage>,
    );

    expect(queryByRole('button', { name: /chiudi/i })).toBeNull();
    fireEvent.click(getByRole('button', { name: /dispositivo/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
