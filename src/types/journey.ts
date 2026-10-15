import { PhotoItem } from './photo';

export interface JourneyCluster {
  id: string;
  title: string;
  subtitle: string;
  dateRange: {
    start: number;
    end: number;
    formatted: string;
    durationDays: number;
  };
  locationName: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  photos: PhotoItem[];
  heroPhoto: PhotoItem;
  highlightPhotos: PhotoItem[];
  totalCount: number;
  curationTag?: string; // e.g. "旅途画卷", "城市漫步", "高光时刻"
}

export type ShowcaseMode = 'editorial' | 'darkroom' | 'filmstrip';
