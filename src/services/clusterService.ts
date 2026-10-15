import { PhotoItem } from '../types/photo';
import { JourneyCluster } from '../types/journey';

/**
 * Calculates geographical distance between two GPS coordinates using Haversine formula (km)
 */
function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format a human-readable date range for the journey
 */
function formatDateRange(startMs: number, endMs: number): { formatted: string; durationDays: number } {
  const startDate = new Date(startMs);
  const endDate = new Date(endMs);

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const diffMs = Math.abs(endMs - startMs);
  const durationDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let formatted = '';
  if (startYear === endDate.getFullYear()) {
    if (startMonth === endMonth && startDay === endDay) {
      formatted = `${startYear}年${startMonth}月${startDay}日`;
    } else if (startMonth === endMonth) {
      formatted = `${startYear}年${startMonth}月${startDay}日 - ${endDay}日`;
    } else {
      formatted = `${startYear}年${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
    }
  } else {
    formatted = `${startYear}年${startMonth}月 - ${endDate.getFullYear()}年${endMonth}月`;
  }

  return { formatted, durationDays };
}

/**
 * Generates an evocative, high-end editorial title for the journey
 */
function generateJourneyTitle(locationName: string, startDate: Date, count: number): { title: string; subtitle: string; tag: string } {
  const month = startDate.getMonth() + 1;
  const year = startDate.getFullYear();

  let title = '';
  let subtitle = '';
  const tag = '旅行';

  if (locationName && locationName !== '光影纪实' && locationName !== '未知足迹') {
    title = `${locationName} (${year}/${month})`;
    subtitle = `共 ${count} 张照片`;
  } else {
    title = `${year}年${month}月 相册集`;
    subtitle = `共 ${count} 张照片`;
  }

  return { title, subtitle, tag };
}

/**
 * Automatically cluster a list of photos into coherent Journeys (Trips / Events)
 * Uses adaptive time-window clustering and optional GPS distance thresholds.
 */
export function clusterPhotosIntoJourneys(photos: PhotoItem[], options: {
  maxGapHours?: number;       // Max gap between photos to belong to same trip (default: 36h)
  minPhotosPerJourney?: number; // Minimum photos to qualify as a journey (default: 3)
  filterScreenshots?: boolean;
} = {}): JourneyCluster[] {
  const { maxGapHours = 36, minPhotosPerJourney = 2, filterScreenshots = true } = options;

  // 1. Filter out screenshots or junk if requested
  const validPhotos = photos.filter(p => {
    if (filterScreenshots && p.isScreenshot) return false;
    return true;
  });

  if (validPhotos.length === 0) return [];

  // 2. Sort chronologically (oldest to newest for clustering)
  const sorted = [...validPhotos].sort((a, b) => a.creationTime - b.creationTime);

  const rawClusters: PhotoItem[][] = [];
  let currentGroup: PhotoItem[] = [sorted[0]];

  const maxGapMs = maxGapHours * 60 * 60 * 1000;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const timeDiff = curr.creationTime - prev.creationTime;
    let shouldSplit = timeDiff > maxGapMs;

    // Check GPS divergence if both have coordinates
    if (!shouldSplit && prev.location && curr.location) {
      const distKm = getHaversineDistanceKm(
        prev.location.latitude,
        prev.location.longitude,
        curr.location.latitude,
        curr.location.longitude
      );
      // If distance jumped > 150km, it's likely a distinct leg or new destination
      if (distKm > 150 && timeDiff > 12 * 60 * 60 * 1000) {
        shouldSplit = true;
      }
    }

    if (shouldSplit) {
      rawClusters.push(currentGroup);
      currentGroup = [curr];
    } else {
      currentGroup.push(curr);
    }
  }

  if (currentGroup.length > 0) {
    rawClusters.push(currentGroup);
  }

  // 3. Transform clusters into Journey objects with editorial metadata
  const journeys: JourneyCluster[] = rawClusters
    .filter(group => group.length >= minPhotosPerJourney)
    .map((group, index) => {
      // Find prominent location
      let prominentLocation = '';
      for (const p of group) {
        if (p.location?.city) {
          prominentLocation = p.location.city;
          break;
        } else if (p.location?.placeName) {
          prominentLocation = p.location.placeName;
          break;
        } else if (p.folderName) {
          prominentLocation = p.folderName;
          break;
        }
      }

      if (!prominentLocation) {
        prominentLocation = '光影纪实';
      }

      const startMs = group[0].creationTime;
      const endMs = group[group.length - 1].creationTime;
      const { formatted, durationDays } = formatDateRange(startMs, endMs);
      const { title, subtitle, tag } = generateJourneyTitle(prominentLocation, new Date(startMs), group.length);

      // Pick the best hero photo (prefer landscape 4:3 or 16:9, or highest resolution)
      const sortedByScore = [...group].sort((a, b) => {
        const scoreA = (a.aspectRatio >= 1.2 && a.aspectRatio <= 1.8 ? 50 : 20) + (a.isFavorite ? 30 : 0);
        const scoreB = (b.aspectRatio >= 1.2 && b.aspectRatio <= 1.8 ? 50 : 20) + (b.isFavorite ? 30 : 0);
        return scoreB - scoreA;
      });

      const heroPhoto = sortedByScore[0];
      const highlightPhotos = sortedByScore.slice(0, Math.min(8, group.length));

      // Photos sorted newest first inside the journey for viewing
      const displayPhotos = [...group].sort((a, b) => b.creationTime - a.creationTime);

      return {
        id: `journey-${startMs}-${index}`,
        title,
        subtitle,
        dateRange: {
          start: startMs,
          end: endMs,
          formatted,
          durationDays,
        },
        locationName: prominentLocation,
        coordinates: group.find(p => p.location)?.location,
        photos: displayPhotos,
        heroPhoto,
        highlightPhotos,
        totalCount: group.length,
        curationTag: tag,
      };
    });

  // Sort journeys newest trip first
  return journeys.sort((a, b) => b.dateRange.start - a.dateRange.start);
}
