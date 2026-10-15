export interface PhotoExif {
  make?: string;           // e.g. "Leica", "Sony", "Apple"
  model?: string;          // e.g. "M11", "A7M4", "iPhone 15 Pro"
  lens?: string;           // e.g. "Summilux-M 35mm f/1.4"
  lensModel?: string;      // alias/detailed lens string
  focalLength?: string;    // e.g. "35mm"
  aperture?: string;       // e.g. "f/1.4"
  shutterSpeed?: string;   // e.g. "1/500s"
  iso?: number;            // e.g. 100
  dateTimeOriginal?: string;
}

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
  city?: string;
  district?: string;
  country?: string;
}

export interface PhotoItem {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;      // Epoch timestamp (ms)
  aspectRatio: number;      // width / height
  mediaType?: 'image' | 'video'; // supports both photos and videos in same flow
  duration?: number;        // duration in seconds for video
  isScreenshot?: boolean;
  isFavorite?: boolean;
  exif?: PhotoExif;
  location?: PhotoLocation;
  sourceType: 'system-library' | 'folder-import';
  folderId?: string;        // stable folder association ID
  folderName?: string;      // displayed folder / album title
  sizeBytes?: number;
  size?: number;            // alias for sizeBytes
}

export interface FolderAssetSource {
  id: string;
  name: string;
  path: string;
  photoCount: number;
  lastScannedTime: number;
  coverUri?: string;
  description?: string;
}
