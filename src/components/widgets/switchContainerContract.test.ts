import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const switchCss = readFileSync(resolve(process.cwd(), 'src/components/widgets/SwitchCard.css'), 'utf8');
const switchView = readFileSync(resolve(process.cwd(), 'src/components/widgets/SwitchCardView.tsx'), 'utf8');

describe('SwitchCard container contract', () => {
  it('owns its visual layout through size container queries', () => {
    expect(switchCss).toContain('container-name: switch-card');
    expect(switchCss).toContain('container-type: size');
    expect(switchCss).toContain('@container switch-card (min-width: 132px) and (min-height: 44px)');
    expect(switchCss).toContain('@container switch-card (min-width: 88px) and (min-height: 96px)');
    expect(switchCss).toContain('@container switch-card (min-width: 170px) and (min-height: 104px)');
    expect(switchCss).toContain('@container switch-card (min-width: 260px) and (min-height: 104px)');
    expect(switchCss).toContain('@container switch-card (min-width: 176px) and (min-height: 160px)');
  });

  it('keeps state attributes without a JS-owned visual variant', () => {
    expect(switchCss).not.toContain('data-switch-variant');
    expect(switchView).not.toContain('data-switch-variant');
    expect(switchView).toContain('data-switch-state');
    expect(switchView).toContain('data-switch-pending');
    expect(switchView).toContain('data-switch-has-consumption');
  });
});
