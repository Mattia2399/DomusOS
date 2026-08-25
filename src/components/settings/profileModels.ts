export type ProfileSectionId = 'members' | 'movements' | 'security';

export type ProfileMovementTimelineEntry = {
  id: string;
  title: string;
  subtitle?: string;
  timestampLabel: string;
  timestampMs: number;
  isCurrent?: boolean;
};

export type ProfileMovementMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  zoneLabel?: string;
  timestampLabel: string;
  timestampMs: number;
  isCurrent?: boolean;
};
