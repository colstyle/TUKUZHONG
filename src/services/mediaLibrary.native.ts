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

  const isVideo = asset.mediaType === 'video' || asset.duration > 0 || /\.(mp4|mov|webm|m4v|mkv)$/i.test(asset.filename || '');
  const width = asset.width || 1080;
  const height = asset.height || 1920;
  const aspectRatio = width / (height || 1);

  return {
    id: asset.id || asset.uri,
    uri: asset.uri,
    filename: asset.filename || (isVideo ? 'VID_CAPTURE.MP4' : 'IMG_PHOTO.JPG'),
    mediaType: isVideo ? 'video' : 'image',
    duration: asset.duration ? Math.round(asset.duration) : undefined,
    width,
    height,
    aspectRatio,
    creationTime: asset.creationTime || asset.modificationTime || Date.now(),
    isScreenshot: isLikelyScreenshot,
    isFavorite: asset.isFavorite || false,
    sourceType: 'system-library',
    exif: asset.exif ? {
      make: asset.exif.Make || asset.exif.make,
      model: asset.exif.Model || asset.exif.model,
      lens: asset.exif.LensModel || asset.exif.lens,
      lensModel: asset.exif.LensModel,
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
  try {
    const MediaLibrary = require('expo-media-library');
    if (!MediaLibrary) {
      return { granted: false, photos: [] };
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return { granted: false, photos: [] };
    }

    // Modern SDK & backward compatible resolution
    let rawAssets: any[] = [];
    if (typeof MediaLibrary.getAssets === 'function') {
      const result = await MediaLibrary.getAssets({
        first: limit,
        mediaType: ['photo', 'video'],
        sortBy: [MediaLibrary.SortBy?.creationTime || 'creationTime'],
      });
      rawAssets = result?.assets || [];
    } else if (typeof MediaLibrary.getAssetsAsync === 'function') {
      try {
        const result = await MediaLibrary.getAssetsAsync({
          first: limit,
          mediaType: ['photo', 'video'],
          sortBy: [MediaLibrary.SortBy?.creationTime || 'creationTime'],
        });
        rawAssets = result?.assets || [];
      } catch (e) {
        console.warn('MediaLibrary.getAssetsAsync failed, caught gracefully:', e);
      }
    }

    const photos: PhotoItem[] = [];
    for (const asset of rawAssets) {
      try {
        if (typeof MediaLibrary.getAssetInfoAsync === 'function') {
          const info = await MediaLibrary.getAssetInfoAsync(asset, { shouldDownloadFromNetwork: false });
          photos.push(normalizeAssetToPhoto({ ...asset, ...info }));
        } else if (typeof asset.getInfoAsync === 'function') {
          const info = await asset.getInfoAsync();
          photos.push(normalizeAssetToPhoto({ ...asset, ...info }));
        } else {
          photos.push(normalizeAssetToPhoto(asset));
        }
      } catch {
        photos.push(normalizeAssetToPhoto(asset));
      }
    }

    return { granted: true, photos };
  } catch (err) {
    console.warn('Native MediaLibrary error:', err);
    return { granted: false, photos: [] };
  }
}
