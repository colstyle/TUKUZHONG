import { PhotoItem, FolderAssetSource } from '../types/photo';

const STORAGE_KEY = 'tukuzhong_library_metadata_v2';
const DB_NAME = 'TukuzhongMediaDB_v1';
const STORE_NAME = 'media_blobs';

// Open or initialize IndexedDB for local persistent binary blobs (images/videos)
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store a single media Blob/File in IndexedDB
export async function storeBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[StorageService] storeBlob failed:', err);
  }
}

// Get a stored Blob from IndexedDB
export async function getBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return null;
  }
}

// Delete blobs from IndexedDB
export async function removeBlobs(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) {
      store.delete(id);
    }
  } catch (err) {
    console.warn('[StorageService] removeBlobs failed:', err);
  }
}

// Save complete library metadata to localStorage
export function saveLibraryMetadata(folders: FolderAssetSource[], photos: PhotoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Strip revocable temporary blob URLs from metadata before serializing
    const sanitizedPhotos = photos.map(p => ({
      ...p,
      // uri is revived from IndexedDB or kept if external https://
      hasPersistentBlob: p.uri.startsWith('blob:')
    }));
    const data = {
      version: 2,
      savedAt: Date.now(),
      folders,
      photos: sanitizedPhotos
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[StorageService] saveLibraryMetadata failed:', err);
  }
}

// Load library and hydrate persistent blob URLs from IndexedDB
export async function loadPersistedLibrary(): Promise<{
  folders: FolderAssetSource[];
  photos: PhotoItem[];
} | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.folders) || !Array.isArray(parsed.photos)) {
      return null;
    }

    const folders: FolderAssetSource[] = parsed.folders;
    const photos: PhotoItem[] = [];

    for (const p of parsed.photos) {
      if (p.hasPersistentBlob || p.uri?.startsWith('blob:')) {
        const blob = await getBlob(p.id);
        if (blob) {
          const freshUri = URL.createObjectURL(blob);
          photos.push({ ...p, uri: freshUri });
          continue;
        }
      }
      // If external image or fallback
      photos.push(p);
    }

    return { folders, photos };
  } catch (err) {
    console.warn('[StorageService] loadPersistedLibrary error:', err);
    return null;
  }
}

// Clear all library data from disk
export async function clearAllLibraryStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('[StorageService] clearAllLibraryStorage error:', err);
  }
}
