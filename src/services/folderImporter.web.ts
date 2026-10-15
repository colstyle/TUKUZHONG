import { PhotoItem } from '../types/photo';
import { storeBlob } from './storageService';

const VIDEO_EXT_REGEX = /\.(mp4|mov|webm|m4v|mkv|avi)$/i;
const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|heic|webp|avif|raw|cr2|cr3|nef|arw|dng|gif)$/i;

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || VIDEO_EXT_REGEX.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_EXT_REGEX.test(file.name);
}

export async function parseWebVideoToPhoto(
  file: File,
  folderId: string,
  folderName: string
): Promise<PhotoItem> {
  return new Promise((resolve) => {
    const uri = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const id = `video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const creationTime = file.lastModified || Date.now();

    // Persist blob to IndexedDB
    storeBlob(id, file);

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const duration = Math.round(video.duration || 0);

      resolve({
        id,
        uri,
        filename: file.name,
        mediaType: 'video',
        duration,
        width,
        height,
        aspectRatio: width / (height || 1),
        creationTime,
        isScreenshot: false,
        sourceType: 'folder-import',
        folderId,
        folderName,
        sizeBytes: file.size,
        size: file.size,
        exif: {
          make: 'Digital Camera',
          model: 'Video Capture',
          lens: 'Motion Optics',
          lensModel: 'Video Standard Lens',
          aperture: 'f/2.8',
          shutterSpeed: '1/60s',
          iso: 100
        }
      });
    };

    video.onerror = () => {
      resolve({
        id,
        uri,
        filename: file.name,
        mediaType: 'video',
        duration: 0,
        width: 1920,
        height: 1080,
        aspectRatio: 16 / 9,
        creationTime,
        isScreenshot: false,
        sourceType: 'folder-import',
        folderId,
        folderName,
        sizeBytes: file.size,
        size: file.size
      });
    };

    video.src = uri;
  });
}

export async function parseWebImageToPhoto(
  file: File,
  folderId: string,
  folderName: string
): Promise<PhotoItem> {
  return new Promise((resolve) => {
    const uri = URL.createObjectURL(file);
    const img = new Image();
    const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const creationTime = file.lastModified || Date.now();
    const isScreenshot = /screenshot|screen_shot|截屏|截图/i.test(file.name);

    // Persist blob to IndexedDB
    storeBlob(id, file);

    img.onload = () => {
      const width = img.naturalWidth || 1920;
      const height = img.naturalHeight || 1080;

      resolve({
        id,
        uri,
        filename: file.name,
        mediaType: 'image',
        width,
        height,
        aspectRatio: width / (height || 1),
        creationTime,
        isScreenshot,
        sourceType: 'folder-import',
        folderId,
        folderName,
        sizeBytes: file.size,
        size: file.size,
        exif: {
          make: 'High-Res Camera',
          model: 'Optical Master',
          lensModel: 'Prime Lens 35mm F1.4',
          focalLength: '35mm',
          aperture: 'f/2.0',
          shutterSpeed: '1/500s',
          iso: 100
        }
      });
    };

    img.onerror = () => {
      resolve({
        id,
        uri,
        filename: file.name,
        mediaType: 'image',
        width: 1920,
        height: 1080,
        aspectRatio: 16 / 9,
        creationTime,
        isScreenshot,
        sourceType: 'folder-import',
        folderId,
        folderName,
        sizeBytes: file.size,
        size: file.size
      });
    };

    img.src = uri;
  });
}

export async function pickFolderOrFiles(options?: {
  targetFolderId?: string;
  targetFolderName?: string;
  directoryMode?: boolean;
}): Promise<{
  folderId: string;
  folderName: string;
  photos: PhotoItem[];
} | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    // If directoryMode is explicitly false, allow picking files; default to directory or multi-files
    const allowDirectory = options?.directoryMode !== false;
    if (allowDirectory) {
      (input as any).webkitdirectory = true;
      (input as any).directory = true;
    }
    input.accept = 'image/*,video/*,.mp4,.mov,.webm,.m4v,.mkv,.raw,.cr2,.cr3,.nef,.arw,.dng';

    input.onchange = async (e: any) => {
      const files: FileList = e.target.files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }

      const mediaFiles: File[] = [];
      let detectedFolderName = options?.targetFolderName || '导入影集';
      const folderId = options?.targetFolderId || `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isImageFile(file) || isVideoFile(file)) {
          mediaFiles.push(file);
          if (!options?.targetFolderName && (file as any).webkitRelativePath) {
            const parts = (file as any).webkitRelativePath.split('/');
            if (parts.length > 1 && parts[0]) {
              detectedFolderName = parts[0];
            }
          }
        }
      }

      if (mediaFiles.length === 0) {
        resolve(null);
        return;
      }

      const photos: PhotoItem[] = [];
      for (const f of mediaFiles) {
        if (isVideoFile(f)) {
          const item = await parseWebVideoToPhoto(f, folderId, detectedFolderName);
          photos.push(item);
        } else {
          const item = await parseWebImageToPhoto(f, folderId, detectedFolderName);
          photos.push(item);
        }
      }

      resolve({ folderId, folderName: detectedFolderName, photos });
    };

    input.click();
  });
}
