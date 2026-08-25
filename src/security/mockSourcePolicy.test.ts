import { describe, expect, it } from 'vitest';
import {
  requestTargetsMockEntity,
  resolveCardDataSource,
  shouldBlockMockEntityApiRequest,
} from './mockSourcePolicy';

describe('mock source outbound policy', () => {
  const mockIds = new Set(['light.demo', 'alarm_control_panel.demo']);

  it('blocks service and API payloads targeting an explicit mock', () => {
    expect(requestTargetsMockEntity({ entity_id: 'light.demo' }, mockIds)).toBe(true);
    expect(requestTargetsMockEntity({ target: { entity_id: ['light.real', 'light.demo'] } }, mockIds)).toBe(true);
    expect(requestTargetsMockEntity({ entity_ids: ['alarm_control_panel.demo'] }, mockIds)).toBe(true);
  });

  it('does not block unrelated real entities', () => {
    expect(requestTargetsMockEntity({ entity_id: 'light.real' }, mockIds)).toBe(false);
  });

  it('allows shared layout persistence while still blocking operational mock requests', () => {
    expect(shouldBlockMockEntityApiRequest({
      type: 'frontend/set_system_data',
      value: { dashboard: { widgets: [{ entityId: 'light.demo' }] } },
    }, mockIds)).toBe(false);
    expect(shouldBlockMockEntityApiRequest({
      type: 'history/history_during_period',
      entity_ids: ['light.demo'],
    }, mockIds)).toBe(true);
  });

  it('derives the card source from the selected entity without a manual UI selector', () => {
    expect(resolveCardDataSource({
      entityId: 'light.real',
      homeAssistantEntityIds: ['light.real'],
      demoEntityIds: ['light.demo'],
    })).toBe('ha');
    expect(resolveCardDataSource({
      entityId: 'light.demo',
      homeAssistantEntityIds: [],
      demoEntityIds: ['light.demo'],
    })).toBe('mock');
    expect(resolveCardDataSource({
      entityId: 'LIGHT.DEMO',
      homeAssistantEntityIds: ['light.demo'],
      demoEntityIds: ['light.demo'],
    })).toBe('ha');
    expect(resolveCardDataSource({
      entityId: 'light.custom_typed',
      homeAssistantEntityIds: [],
      demoEntityIds: ['light.demo'],
    })).toBe('ha');
  });
});
