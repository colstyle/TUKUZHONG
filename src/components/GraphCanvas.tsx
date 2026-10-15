import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import { JourneyCluster } from '../types/journey';
import { FolderAssetSource, PhotoItem } from '../types/photo';

export type GraphClusterType = 'trips' | 'folders' | 'locations' | 'cameras';

export interface SelectedNodeDetail {
  type: 'trip' | 'folder';
  id: string;
  title: string;
  subtitle: string;
  count: number;
  dateStr: string;
  photos: PhotoItem[];
  coverUri?: string;
  cameraInfo?: string;
}

interface GraphCanvasProps {
  journeys: JourneyCluster[];
  folders: FolderAssetSource[];
  photos: PhotoItem[];
  onSelectNode: (detail: SelectedNodeDetail) => void;
  selectedNodeId?: string | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  journeys,
  folders,
  photos,
  onSelectNode,
  selectedNodeId,
}) => {
  const [activeCluster, setActiveCluster] = useState<GraphClusterType>('trips');
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Extract locations and cameras from photos
  const uniqueLocations = Array.from(new Set(photos.map(p => p.location?.city || p.location?.placeName).filter(Boolean)));
  const uniqueCameras = Array.from(new Set(photos.map(p => p.exif?.model).filter(Boolean)));

  // Current expanded items based on active cluster
  const currentBranchItems: {
    id: string;
    title: string;
    subtitle: string;
    count: number;
    dateStr: string;
    photos: PhotoItem[];
    coverUri?: string;
    cameraInfo?: string;
    type: 'trip' | 'folder';
  }[] = activeCluster === 'trips'
    ? journeys.map(j => ({
        id: j.id,
        title: j.title,
        subtitle: j.subtitle,
        count: j.totalCount,
        dateStr: j.dateRange.formatted,
        photos: j.photos,
        coverUri: j.heroPhoto?.uri,
        cameraInfo: j.heroPhoto?.exif?.model,
        type: 'trip' as const,
      }))
    : activeCluster === 'folders'
    ? folders.map(f => {
        const folderPhotos = photos.filter(p => p.folderName === f.name);
        return {
          id: f.id,
          title: f.name,
          subtitle: `本地导入 · ${folderPhotos.length} 张原片`,
          count: folderPhotos.length,
          dateStr: new Date(f.lastScannedTime).toLocaleDateString('zh-CN'),
          photos: folderPhotos,
          coverUri: folderPhotos[0]?.uri,
          cameraInfo: folderPhotos[0]?.exif?.model,
          type: 'folder' as const,
        };
      })
    : [];

  return (
    <View style={styles.container}>
      {/* Top Breadcrumb Navigation (Matching UI.mp4 frame_016/020) */}
      <View style={styles.breadcrumbBar}>
        <Text style={styles.breadcrumbRoot}>图谱总览 Core</Text>
        <Text style={styles.breadcrumbDivider}>/</Text>
        <Text style={styles.breadcrumbCurrent}>
          {activeCluster === 'trips'
            ? '旅行画卷 Trips'
            : activeCluster === 'folders'
            ? '导入文件夹 Folders'
            : activeCluster === 'locations'
            ? '足迹分布 Locations'
            : '器材矩阵 Cameras'}
        </Text>
        {selectedNodeId && (
          <>
            <Text style={styles.breadcrumbDivider}>/</Text>
            <Text numberOfLines={1} style={styles.breadcrumbTarget}>
              {currentBranchItems.find(i => i.id === selectedNodeId)?.title || '详细项'}
            </Text>
          </>
        )}
      </View>

      {/* Main Graph Visualization Stage */}
      <View style={styles.stage}>
        {/* Ambient Center Constellation Glow */}
        <View style={styles.ambientCoreGlow}>
          <Svg width={300} height={300} viewBox="0 0 300 300">
            <Defs>
              <RadialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#E5A93C" stopOpacity="0.35" />
                <Stop offset="40%" stopColor="#7A5AF8" stopOpacity="0.15" />
                <Stop offset="80%" stopColor="#08080B" stopOpacity="0.05" />
                <Stop offset="100%" stopColor="#08080B" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="150" cy="150" r="140" fill="url(#coreGrad)" />
          </Svg>
        </View>

        {/* LEFT COLUMN: HUB CLUSTERS */}
        <View style={styles.hubColumn}>
          {/* Hub 1: 旅行画卷 (Trips) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveCluster('trips')}
            style={[
              styles.hubCard,
              activeCluster === 'trips' && styles.hubCardActive,
            ]}
          >
            <View style={styles.hubTopRow}>
              <Text style={styles.hubIcon}>✈️</Text>
              <Text style={styles.hubCount}>{journeys.length}</Text>
            </View>
            <Text style={styles.hubLabel}>旅行画卷</Text>
            <Text style={styles.hubSub}>{photos.length} 帧光影</Text>
          </TouchableOpacity>

          {/* Hub 2: 导入文件夹 (Folders) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveCluster('folders')}
            style={[
              styles.hubCard,
              activeCluster === 'folders' && styles.hubCardActive,
            ]}
          >
            <View style={styles.hubTopRow}>
              <Text style={styles.hubIcon}>📁</Text>
              <Text style={styles.hubCount}>{folders.length}</Text>
            </View>
            <Text style={styles.hubLabel}>导入文件夹</Text>
            <Text style={styles.hubSub}>独立存储目录</Text>
          </TouchableOpacity>

          {/* Hub 3: 足迹地点 (Locations) */}
          <View style={styles.hubCardInactive}>
            <View style={styles.hubTopRow}>
              <Text style={styles.hubIcon}>📍</Text>
              <Text style={styles.hubCount}>{uniqueLocations.length || 3}</Text>
            </View>
            <Text style={styles.hubLabel}>足迹城市</Text>
            <Text style={styles.hubSub}>GPS 定位点</Text>
          </View>

          {/* Hub 4: 相机机型 (Cameras) */}
          <View style={styles.hubCardInactive}>
            <View style={styles.hubTopRow}>
              <Text style={styles.hubIcon}>📷</Text>
              <Text style={styles.hubCount}>{uniqueCameras.length || 2}</Text>
            </View>
            <Text style={styles.hubLabel}>器材档案</Text>
            <Text style={styles.hubSub}>EXIF 镜头</Text>
          </View>
        </View>

        {/* CENTER-TO-RIGHT: NEURAL BRANCH LINES & NODES */}
        <View style={styles.branchStage}>
          {/* SVG Connection Curves */}
          <Svg style={styles.svgOverlay} width="160" height="420" viewBox="0 0 160 420">
            <Defs>
              <LinearGradient id="lineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <Stop offset="0%" stopColor="#FFF" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#E5A93C" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            {currentBranchItems.map((_, index) => {
              const startY = 110; // origin hub height
              const total = Math.max(1, currentBranchItems.length);
              const step = 380 / (total + 1);
              const endY = 30 + (index + 1) * step;
              const pathD = `M 0,${startY} C 80,${startY} 80,${endY} 160,${endY}`;
              return (
                <React.Fragment key={`path-${index}`}>
                  <Path
                    d={pathD}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="1.2"
                    strokeOpacity={0.45}
                  />
                  <Circle cx="158" cy={endY} r="3" fill="#E5A93C" />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* RIGHT COLUMN: BRANCH ITEMS LIST */}
          <ScrollView
            style={styles.branchScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.branchItemsContainer}
          >
            {currentBranchItems.map((item) => {
              const isSelected = selectedNodeId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.88}
                  onPress={() => onSelectNode(item)}
                  style={[
                    styles.nodeItemCard,
                    isSelected && styles.nodeItemCardSelected,
                  ]}
                >
                  {/* Left thumbnail or icon */}
                  {item.coverUri ? (
                    <Image source={{ uri: item.coverUri }} style={styles.nodeThumb} />
                  ) : (
                    <View style={styles.nodeThumbPlaceholder}>
                      <Text style={{ fontSize: 14 }}>{item.type === 'trip' ? '✈️' : '📁'}</Text>
                    </View>
                  )}

                  {/* Title & metrics */}
                  <View style={styles.nodeMeta}>
                    <Text numberOfLines={1} style={styles.nodeTitle}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.nodeSubtitle}>
                      {item.count} 张 · {item.dateStr}
                    </Text>
                  </View>

                  {/* Indicator arrow */}
                  <Text style={[styles.arrowGlyph, isSelected && { color: '#E5A93C' }]}>
                    ›
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080B',
    position: 'relative',
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  breadcrumbRoot: {
    color: '#80808C',
    fontSize: 12,
  },
  breadcrumbDivider: {
    color: '#444450',
    fontSize: 12,
  },
  breadcrumbCurrent: {
    color: '#D4D4DE',
    fontSize: 12,
    fontWeight: '500',
  },
  breadcrumbTarget: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
  },
  stage: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  ambientCoreGlow: {
    position: 'absolute',
    left: '18%',
    top: '20%',
    pointerEvents: 'none',
  },
  hubColumn: {
    width: 140,
    gap: 12,
    zIndex: 10,
    paddingVertical: 10,
  },
  hubCard: {
    backgroundColor: 'rgba(22, 22, 28, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  hubCardActive: {
    borderColor: '#E5A93C',
    backgroundColor: 'rgba(32, 28, 22, 0.85)',
    shadowColor: '#E5A93C',
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  hubCardInactive: {
    backgroundColor: 'rgba(16, 16, 20, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    opacity: 0.7,
  },
  hubTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hubIcon: {
    fontSize: 16,
  },
  hubCount: {
    color: '#F4F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  hubLabel: {
    color: '#E0E0E6',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  hubSub: {
    color: '#70707C',
    fontSize: 9,
  },
  branchStage: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
  },
  svgOverlay: {
    width: 130,
    height: 420,
    zIndex: 5,
  },
  branchScroll: {
    flex: 1,
  },
  branchItemsContainer: {
    gap: 10,
    paddingVertical: 10,
    paddingRight: 10,
  },
  nodeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 26, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    gap: 12,
  },
  nodeItemCardSelected: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(34, 34, 44, 0.95)',
    shadowColor: '#FFF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  nodeThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  nodeThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1C1C24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeMeta: {
    flex: 1,
  },
  nodeTitle: {
    color: '#F4F4F6',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  nodeSubtitle: {
    color: '#8A8A96',
    fontSize: 10,
  },
  arrowGlyph: {
    color: '#555562',
    fontSize: 18,
    fontWeight: '300',
  },
});
