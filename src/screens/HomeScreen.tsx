import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { PhotoItem, FolderAssetSource } from '../types/photo';
import { JourneyCluster } from '../types/journey';
import { clusterPhotosIntoJourneys } from '../services/clusterService';
import { fetchNativeMediaLibrary } from '../services/mediaLibrary';
import {
  saveLibraryMetadata,
  loadPersistedLibrary,
  removeBlobs
} from '../services/storageService';
import { TukuzhongHeader, MainTabType } from '../components/TukuzhongHeader';
import { NeuralDashboard } from '../components/neural/NeuralDashboard';
import {
  NeuralConstellationGraph,
  SelectedNodeDetail,
} from '../components/NeuralConstellationGraph';
import { InspectorDrawer } from '../components/InspectorDrawer';
import { BottomHudConsole } from '../components/BottomHudConsole';
import { CleanGalleryView } from '../components/CleanGalleryView';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { FolderImportModal } from '../components/FolderImportModal';

export const HomeScreen: React.FC = () => {
  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<string>('graph');
  const [filterScreenshots, setFilterScreenshots] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data: Startup begins clean without fake mock camera benchmarks
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [folders, setFolders] = useState<FolderAssetSource[]>([]);

  // Selected node & Drawer
  const [selectedNode, setSelectedNode] = useState<SelectedNodeDetail | null>(null);

  // Gallery Drilldown state
  const [galleryViewData, setGalleryViewData] = useState<{
    title: string;
    subtitle?: string;
    photos: PhotoItem[];
  } | null>(null);

  // Modals
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<PhotoItem[]>([]);
  const [folderModalVisible, setFolderModalVisible] = useState(false);

  // Hydrate persistent library from IndexedDB / localStorage on startup
  useEffect(() => {
    async function initLibrary() {
      if (Platform.OS === 'web') {
        const persisted = await loadPersistedLibrary();
        if (persisted && (persisted.photos.length > 0 || persisted.folders.length > 0)) {
          setPhotos(persisted.photos);
          setFolders(persisted.folders);
        }
      } else {
        const { granted, photos: nativePhotos } = await fetchNativeMediaLibrary(300);
        if (granted && nativePhotos.length > 0) {
          setPhotos(nativePhotos);
        }
      }
    }
    initLibrary();
  }, []);

  // Save metadata changes to persistent storage
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (Platform.OS === 'web') {
      saveLibraryMetadata(folders, photos);
    }
  }, [folders, photos]);

  // Filter photos by search or screenshots
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (filterScreenshots && p.isScreenshot) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const matchCity = p.location?.city?.toLowerCase().includes(q);
      const matchPlace = p.location?.placeName?.toLowerCase().includes(q);
      const matchFolder = p.folderName?.toLowerCase().includes(q);
      const matchModel = p.exif?.model?.toLowerCase().includes(q);
      const matchMake = p.exif?.make?.toLowerCase().includes(q);
      const matchFile = p.filename?.toLowerCase().includes(q);
      return matchCity || matchPlace || matchFolder || matchModel || matchMake || matchFile;
    });
  }, [photos, filterScreenshots, searchQuery]);

  // Cluster photos into journeys (adaptive DBSCAN / Time-window)
  const journeys = useMemo(() => {
    return clusterPhotosIntoJourneys(filteredPhotos, {
      maxGapHours: 36,
      minPhotosPerJourney: 1,
      filterScreenshots,
    });
  }, [filteredPhotos, filterScreenshots]);

  // Counts
  const totalScreenshotsFiltered = useMemo(() => {
    return photos.filter((p) => p.isScreenshot).length;
  }, [photos]);

  // Handle imported folder with stable folderId
  const handlePhotosImported = (folderName: string, newPhotos: PhotoItem[], folderId?: string) => {
    const finalFolderId = folderId || newPhotos[0]?.folderId || `folder-${Date.now()}`;
    const normalizedPhotos = newPhotos.map(p => ({
      ...p,
      folderId: p.folderId || finalFolderId,
      folderName: p.folderName || folderName
    }));

    setPhotos((prev) => [...normalizedPhotos, ...prev]);
    setFolders((prev) => {
      const exists = prev.find(f => f.id === finalFolderId || f.name === folderName);
      if (exists) {
        return prev.map(f => f.id === exists.id ? {
          ...f,
          photoCount: f.photoCount + normalizedPhotos.length,
          lastScannedTime: Date.now()
        } : f);
      }
      return [
        {
          id: finalFolderId,
          name: folderName,
          path: `/${folderName}`,
          photoCount: normalizedPhotos.length,
          lastScannedTime: Date.now(),
          coverUri: normalizedPhotos[0]?.uri,
        },
        ...prev,
      ];
    });
  };

  // Handle renaming a folder
  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName, path: `/${newName}` } : f));
    setPhotos(prev => prev.map(p => p.folderId === folderId ? { ...p, folderName: newName } : p));
  };

  // Handle appending photos to an existing folder
  const handleAppendToFolder = (folderId: string, addedPhotos: PhotoItem[]) => {
    const targetFolder = folders.find(f => f.id === folderId);
    const normalized = addedPhotos.map(p => ({
      ...p,
      folderId,
      folderName: targetFolder?.name || p.folderName || '未命名目录'
    }));
    setPhotos(prev => [...normalized, ...prev]);
    setFolders(prev => prev.map(f => f.id === folderId ? {
      ...f,
      photoCount: f.photoCount + normalized.length,
      lastScannedTime: Date.now()
    } : f));
  };

  // Open Fullscreen Viewer
  const handleOpenViewer = (photoList: PhotoItem[], index: number = 0) => {
    setViewerPhotos(photoList);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  // Handle removal of a folder and its associated photos (index removal only)
  const handleRemoveFolder = (folderId: string) => {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;
    const toDelete = photos.filter(p => p.folderId === folderId || p.folderName === target.name);
    if (toDelete.length > 0) {
      removeBlobs(toDelete.map(p => p.id));
    }
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setPhotos((prev) => prev.filter((p) => p.folderId !== folderId && p.folderName !== target.name));
  };

  // Handle removal of a single photo
  const handleRemovePhoto = (photoId: string) => {
    removeBlobs([photoId]);
    setPhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== photoId);
      setFolders((oldFolders) =>
        oldFolders.map((f) => ({
          ...f,
          photoCount: remaining.filter((p) => p.folderId === f.id || p.folderName === f.name).length,
        }))
      );
      return remaining;
    });
    setViewerPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // On Web, render the full Neural Creator Dashboard with the 5 unified perspectives
  if (Platform.OS === 'web') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0d0e0e' }}>
        <NeuralDashboard
          photos={filteredPhotos}
          folders={folders}
          journeys={journeys}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setGalleryViewData(null);
          }}
          onImportFolder={() => setFolderModalVisible(true)}
          onRenameFolder={handleRenameFolder}
          onAppendToFolder={handleAppendToFolder}
          onRemoveFolder={handleRemoveFolder}
          onRemovePhoto={handleRemovePhoto}
          filterScreenshots={filterScreenshots}
          onToggleFilterScreenshots={() => setFilterScreenshots(!filterScreenshots)}
          onOpenViewer={handleOpenViewer}
        />

        {/* Fullscreen Viewer Modal */}
        <PhotoViewerModal
          visible={viewerVisible}
          photos={viewerPhotos}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
          onDeletePhoto={handleRemovePhoto}
        />

        {/* Folder Importer Modal */}
        <FolderImportModal
          visible={folderModalVisible}
          onClose={() => setFolderModalVisible(false)}
          folderSources={folders}
          onPhotosImported={handlePhotosImported}
          onRemoveFolder={handleRemoveFolder}
        />
      </div>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#08080B" />

      {/* Top Header: 图库中 */}
      <TukuzhongHeader
        activeTab={activeTab as any}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setGalleryViewData(null);
        }}
        onImportFolder={() => setFolderModalVisible(true)}
        isFilterScreenshots={filterScreenshots}
        onToggleFilterScreenshots={() => setFilterScreenshots(!filterScreenshots)}
      />

      {/* Main Body */}
      <View style={styles.body}>
        {galleryViewData ? (
          <CleanGalleryView
            title={galleryViewData.title}
            subtitle={galleryViewData.subtitle}
            photos={galleryViewData.photos}
            onSelectPhoto={(photo, idx) => handleOpenViewer(galleryViewData.photos, idx)}
            onBack={() => setGalleryViewData(null)}
          />
        ) : activeTab === 'graph' ? (
          <View style={styles.graphContainer}>
            <View style={styles.graphAndDrawerRow}>
              <NeuralConstellationGraph
                journeys={journeys}
                folders={folders}
                photos={filteredPhotos}
                onSelectNode={(detail) => setSelectedNode(detail)}
                selectedNodeId={selectedNode?.id}
                onImportClick={() => setFolderModalVisible(true)}
              />

              {selectedNode && (
                <InspectorDrawer
                  detail={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onOpenGallery={(photosToView, initialIdx) => {
                    handleOpenViewer(photosToView, initialIdx || 0);
                  }}
                />
              )}
            </View>

            <BottomHudConsole
              totalPhotos={filteredPhotos.length}
              totalTrips={journeys.length}
              totalFolders={folders.length}
              totalFiltered={totalScreenshotsFiltered}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTag={(tag) => setSearchQuery(tag)}
            />
          </View>
        ) : (
          <CleanGalleryView
            title="全部作品"
            subtitle={`共 ${filteredPhotos.length} 件作品`}
            photos={filteredPhotos}
            onSelectPhoto={(photo, idx) => handleOpenViewer(filteredPhotos, idx)}
          />
        )}
      </View>

      {/* Fullscreen Viewer Modal */}
      <PhotoViewerModal
        visible={viewerVisible}
        photos={viewerPhotos}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
        onDeletePhoto={handleRemovePhoto}
      />

      {/* Folder Importer Modal */}
      <FolderImportModal
        visible={folderModalVisible}
        onClose={() => setFolderModalVisible(false)}
        folderSources={folders}
        onPhotosImported={handlePhotosImported}
        onRemoveFolder={handleRemoveFolder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080B',
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  graphContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  graphAndDrawerRow: {
    flex: 1,
    flexDirection: 'row',
  },
});
