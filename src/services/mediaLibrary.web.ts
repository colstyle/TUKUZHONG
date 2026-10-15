import { PhotoItem } from '../types/photo';

export interface MediaLibraryState {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  photos: PhotoItem[];
}

export function normalizeAssetToPhoto(asset: any): PhotoItem {
  const isLikelyScreenshot = 
    (asset.filename && /screenshot|screen_shot|截屏|截图/i.test(asset.filename)) ||
    (asset.mediaSubtypes && asset.mediaSubtypes.includes('screenshot'));

  const width = asset.width || 1080;
  const height = asset.height || 1920;
  const aspectRatio = width / (height || 1);

  return {
    id: asset.id || asset.uri,
    uri: asset.uri,
    filename: asset.filename || 'IMG_PHOTO.JPG',
    width,
    height,
    aspectRatio,
    creationTime: asset.creationTime || asset.modificationTime || Date.now(),
    isScreenshot: isLikelyScreenshot,
    isFavorite: asset.isFavorite || false,
    sourceType: 'system-library',
    exif: asset.exif ? {
      make: asset.exif.Make,
      model: asset.exif.Model,
      lens: asset.exif.LensModel,
      focalLength: asset.exif.FocalLength ? `${asset.exif.FocalLength}mm` : undefined,
      aperture: asset.exif.FNumber ? `f/${asset.exif.FNumber}` : undefined,
      shutterSpeed: asset.exif.ExposureTime ? `1/${Math.round(1 / asset.exif.ExposureTime)}s` : undefined,
      iso: asset.exif.ISOSpeedRatings,
    } : undefined,
    location: asset.location ? {
      latitude: asset.location.latitude,
      longitude: asset.location.longitude,
    } : undefined,
  };
}

export async function fetchNativeMediaLibrary(limit: number = 200): Promise<{
  granted: boolean;
  photos: PhotoItem[];
}> {
  // Web does not have direct OS-level media library daemon, returns empty and relies on Folder / File import
  return { granted: true, photos: [] };
}
