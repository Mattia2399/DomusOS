import { beforeEach, describe, expect, it } from 'vitest';
import type { HomeAttentionItem } from './homeAttentionEngine';
import {
  getHomeAttentionItemFingerprint,
  isHomeAttentionItemSuppressed,
  readHomeAttentionSuppressions,
  resolveHomeAttentionSnoozeUntil,
  saveHomeAttentionSuppressions,
} from './homeAttentionSuppressions';

const NOW = Date.parse('2026-07-30T10:00:00');
const warningItem: HomeAttentionItem = {
  id: 'opening:binary_sensor.window',
  source: 'ha',
  severity: 'warning',
  category: 'opening',
  title: 'Finestra aperta',
  description: 'Apertura rilevata.',
  entityId: 'binary_sensor.window',
  activeSince: NOW - 20 * 60_000,
};

beforeEach(() => window.localStorage.clear());

describe('homeAttentionSuppressions', () => {
  it('snoozes a non-critical item only until the selected deadline', () => {
    const until = resolveHomeAttentionSnoozeUntil('hour', NOW);
    const suppressions = saveHomeAttentionSuppressions(
      'real',
      [{
        itemId: warningItem.id,
        fingerprint: getHomeAttentionItemFingerprint(warningItem),
        mode: 'snooze',
        until,
      }],
      window.localStorage,
      NOW,
    );

    expect(isHomeAttentionItemSuppressed(warningItem, suppressions, NOW)).toBe(true);
    expect(isHomeAttentionItemSuppressed(warningItem, suppressions, until)).toBe(false);
    expect(readHomeAttentionSuppressions('real', window.localStorage, until)).toEqual([]);
  });

  it('releases an ignored item when its state fingerprint changes', () => {
    const suppressions = [{
      itemId: warningItem.id,
      fingerprint: getHomeAttentionItemFingerprint(warningItem),
      mode: 'until_change' as const,
    }];
    const changedItem = { ...warningItem, activeSince: warningItem.activeSince! + 60_000 };

    expect(isHomeAttentionItemSuppressed(warningItem, suppressions, NOW)).toBe(true);
    expect(isHomeAttentionItemSuppressed(changedItem, suppressions, NOW)).toBe(false);
  });

  it('never suppresses a critical safety item', () => {
    const criticalItem = {
      ...warningItem,
      severity: 'critical' as const,
      category: 'safety' as const,
    };
    expect(isHomeAttentionItemSuppressed(
      criticalItem,
      [{
        itemId: criticalItem.id,
        fingerprint: getHomeAttentionItemFingerprint(criticalItem),
        mode: 'until_change',
      }],
      NOW,
    )).toBe(false);
  });
});
