import { PhotoItem } from '../types/photo';

export async function pickFolderOrFiles(options?: {
  targetFolderId?: string;
  targetFolderName?: string;
}): Promise<{
  folderId: string;
  folderName: string;
  photos: PhotoItem[];
} | null> {
  try {
    const DocumentPicker = require('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'video/*'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const folderId = options?.targetFolderId || `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const folderName = options?.targetFolderName || '外部导入影集';

    const photos: PhotoItem[] = result.assets.map((asset: any, index: number) => {
      const width = asset.width || 1920;
      const height = asset.height || 1080;
      const isVideo = asset.mimeType?.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv)$/i.test(asset.name || '');

      return {
        id: `native-doc-${Date.now()}-${index}`,
        uri: asset.uri,
        filename: asset.name || (isVideo ? `Video_${index + 1}.mp4` : `Photo_${index + 1}.jpg`),
        mediaType: isVideo ? 'video' : 'image',
        width,
        height,
        aspectRatio: width / (height || 1),
        creationTime: Date.now() - (index * 60000),
        sourceType: 'folder-import',
        folderId,
        folderName,
        sizeBytes: asset.size,
      };
    });

    return { folderId, folderName, photos };
  } catch (err) {
    console.warn('Native DocumentPicker failed:', err);
    return null;
  }
}
