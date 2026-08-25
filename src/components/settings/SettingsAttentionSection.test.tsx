import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_HOME_ATTENTION_PREFERENCES } from '../homeAttention/homeAttentionPreferences';
import SettingsAttentionSection from './SettingsAttentionSection';

afterEach(cleanup);

describe('SettingsAttentionSection', () => {
  it('updates a category without changing unrelated preferences', () => {
    const onChange = vi.fn();
    render(
      <SettingsAttentionSection
        preferences={DEFAULT_HOME_ATTENTION_PREFERENCES}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('switch', { name: 'Mostra batterie basse' }),
    );
    const updater = onChange.mock.calls[0][0];
    expect(updater(DEFAULT_HOME_ATTENTION_PREFERENCES)).toEqual({
      ...DEFAULT_HOME_ATTENTION_PREFERENCES,
      categories: {
        ...DEFAULT_HOME_ATTENTION_PREFERENCES.categories,
        battery: false,
      },
    });
  });

  it('explains that hiding safety does not disable Home Assistant', () => {
    render(
      <SettingsAttentionSection
        preferences={{
          ...DEFAULT_HOME_ATTENTION_PREFERENCES,
          categories: {
            ...DEFAULT_HOME_ATTENTION_PREFERENCES.categories,
            safety: false,
          },
        }}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole('status').textContent).toMatch(
      /Home Assistant continuano comunque a funzionare/i,
    );
  });

  it('lets an administrator restore temporarily hidden alerts', () => {
    const onClearSuppressions = vi.fn();
    render(
      <SettingsAttentionSection
        preferences={DEFAULT_HOME_ATTENTION_PREFERENCES}
        onChange={vi.fn()}
        onReset={vi.fn()}
        suppressedCount={2}
        onClearSuppressions={onClearSuppressions}
      />,
    );

    expect(screen.getByText('2 avvisi sono temporaneamente nascosti.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra di nuovo' }));
    expect(onClearSuppressions).toHaveBeenCalledTimes(1);
  });
});
