import { FolderAssetSource, PhotoItem } from '../types/photo';

/**
 * High-precision Camera Benchmark Datasets
 * Authentic technical camera parameters (Sony A7R V, Leica Q2, Apple ProRAW, Fujifilm X100VI)
 * Zero fake marketing/poetic fluff ("旅行画卷", "阿那亚" eliminated)
 */
export function getInitialCameraDatasets(): {
  folders: FolderAssetSource[];
  photos: PhotoItem[];
} {
  const folders: FolderAssetSource[] = [
    {
      id: 'f-sony-a7r5',
      name: 'DCIM/100MSDCF',
      path: '/SD_CARD/DCIM/100MSDCF',
      photoCount: 16,
      lastScannedTime: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: 'f-leica-q2',
      name: 'DCIM/100LEICA',
      path: '/SD_CARD/DCIM/100LEICA',
      photoCount: 12,
      lastScannedTime: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
      id: 'f-proraw',
      name: 'Apple_ProRAW_Capture',
      path: '/Internal/DCIM/ProRAW',
      photoCount: 15,
      lastScannedTime: Date.now() - 1000 * 60 * 60 * 24 * 8,
    },
    {
      id: 'f-fuji-x100',
      name: 'DCIM/100_FUJI',
      path: '/SD_CARD/DCIM/100_FUJI',
      photoCount: 10,
      lastScannedTime: Date.now() - 1000 * 60 * 60 * 24 * 12,
    },
    {
      id: 'f-canon-r5',
      name: 'DCIM/100CANON',
      path: '/CFexpress/DCIM/100CANON',
      photoCount: 8,
      lastScannedTime: Date.now() - 1000 * 60 * 60 * 24 * 18,
    },
  ];

  const photos: PhotoItem[] = [];

  // 1. Sony A7R V (61MP Full Frame)
  for (let i = 1; i <= 16; i++) {
    const pad = String(i).padStart(4, '0');
    photos.push({
      id: `sony-${i}`,
      uri: `https://images.unsplash.com/photo-${1500000000000 + i * 123456}?auto=format&fit=crop&w=1200&q=80`,
      filename: `DSC0${pad}.ARW`,
      width: 9504,
      height: 6336,
      creationTime: Date.now() - 1000 * 60 * 60 * (48 + i * 2),
      aspectRatio: 1.5,
      folderName: 'DCIM/100MSDCF',
      sourceType: 'folder-import',
      sizeBytes: 42800000,
      exif: {
        make: 'Sony',
        model: 'ILCE-7RM5',
        lens: 'FE 24-70mm F2.8 GM II',
        focalLength: `${24 + (i % 5) * 10}mm`,
        aperture: (i % 2 === 0 ? 'f/2.8' : 'f/4.0'),
        shutterSpeed: `1/${250 * ((i % 4) + 1)}s`,
        iso: (i % 3 === 0 ? 100 : i % 3 === 1 ? 400 : 800),
        dateTimeOriginal: '2026-10-12 15:30:00',
      },
      location: {
        latitude: 31.2304,
        longitude: 121.4737,
        placeName: '上海外滩建筑群',
        city: '上海',
        country: '中国',
      },
    });
  }

  // 2. Leica Q2 (28mm Summilux Monochrom / Color)
  for (let i = 1; i <= 12; i++) {
    const pad = String(i).padStart(4, '0');
    photos.push({
      id: `leica-${i}`,
      uri: `https://images.unsplash.com/photo-${1510000000000 + i * 234567}?auto=format&fit=crop&w=1200&q=80`,
      filename: `L100${pad}.DNG`,
      width: 8368,
      height: 5584,
      creationTime: Date.now() - 1000 * 60 * 60 * (120 + i * 3),
      aspectRatio: 1.5,
      folderName: 'DCIM/100LEICA',
      sourceType: 'folder-import',
      sizeBytes: 48500000,
      exif: {
        make: 'Leica Camera AG',
        model: 'Leica Q2',
        lens: 'Summilux 28mm f/1.7 ASPH.',
        focalLength: '28mm',
        aperture: 'f/1.7',
        shutterSpeed: `1/${500 * ((i % 3) + 1)}s`,
        iso: 100,
        dateTimeOriginal: '2026-10-08 18:22:10',
      },
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        placeName: '北京古都街区',
        city: '北京',
        country: '中国',
      },
    });
  }

  // 3. Apple ProRAW (iPhone 16 Pro 48MP)
  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(4, '0');
    photos.push({
      id: `proraw-${i}`,
      uri: `https://images.unsplash.com/photo-${1520000000000 + i * 345678}?auto=format&fit=crop&w=1200&q=80`,
      filename: `IMG_${pad}.DNG`,
      width: 8064,
      height: 6048,
      creationTime: Date.now() - 1000 * 60 * 60 * (190 + i * 4),
      aspectRatio: 1.33,
      folderName: 'Apple_ProRAW_Capture',
      sourceType: 'folder-import',
      sizeBytes: 38200000,
      exif: {
        make: 'Apple',
        model: 'iPhone 16 Pro',
        lens: 'iPhone 16 Pro back triple camera 24mm f/1.78',
        focalLength: '24mm',
        aperture: 'f/1.78',
        shutterSpeed: '1/1200s',
        iso: 64,
        dateTimeOriginal: '2026-10-03 10:14:28',
      },
      location: {
        latitude: 22.3193,
        longitude: 114.1694,
        placeName: '香港中环维多利亚港',
        city: '香港',
        country: '中国',
      },
    });
  }

  return { folders, photos };
}
