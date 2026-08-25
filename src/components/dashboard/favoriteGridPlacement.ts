import type { Widget } from '../../types/dashboardModels';

type FavoriteGridTargetInput = {
  widget: Widget;
  favoriteSectionIds: ReadonlySet<string>;
  fallbackSectionId: string;
  isMarkedFavorite: boolean;
};

export function resolveFavoriteGridTargetSectionId({
  widget,
  favoriteSectionIds,
  fallbackSectionId,
  isMarkedFavorite,
}: FavoriteGridTargetInput): string | null {
  const currentParentId = widget.parentSectionId;
  if (currentParentId && favoriteSectionIds.has(currentParentId)) {
    return currentParentId;
  }

  if (!currentParentId && widget.placementPolicy === 'favorites-auto' && isMarkedFavorite) {
    return fallbackSectionId;
  }

  return null;
}
