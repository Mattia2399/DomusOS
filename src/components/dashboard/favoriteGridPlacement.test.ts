import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { resolveFavoriteGridTargetSectionId } from './favoriteGridPlacement';

function buildWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'light.test',
    kind: 'light',
    title: 'Luce test',
    entityId: 'light.test',
    status: 'Accesa',
    isOn: true,
    layout: { i: 'light.test', x: 0, y: 0, w: 2, h: 2 },
    ...overrides,
  };
}

describe('favorite grid placement', () => {
  const favoriteSectionIds = new Set(['section-favorites']);

  it('never steals a manually placed root card', () => {
    const target = resolveFavoriteGridTargetSectionId({
      widget: buildWidget({ isFavorite: true, placementPolicy: 'manual' }),
      favoriteSectionIds,
      fallbackSectionId: 'section-favorites',
      isMarkedFavorite: true,
    });

    expect(target).toBeNull();
  });

  it('places only an automatically managed favorite into the fallback grid', () => {
    const target = resolveFavoriteGridTargetSectionId({
      widget: buildWidget({ isFavorite: true, placementPolicy: 'favorites-auto' }),
      favoriteSectionIds,
      fallbackSectionId: 'section-favorites',
      isMarkedFavorite: true,
    });

    expect(target).toBe('section-favorites');
  });

  it('keeps a card that already belongs to a favorites grid', () => {
    const target = resolveFavoriteGridTargetSectionId({
      widget: buildWidget({ parentSectionId: 'section-favorites', placementPolicy: 'manual' }),
      favoriteSectionIds,
      fallbackSectionId: 'section-favorites',
      isMarkedFavorite: false,
    });

    expect(target).toBe('section-favorites');
  });
});
