import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { JourneyCluster } from '../types/journey';
import { FolderAssetSource, PhotoItem } from '../types/photo';
import { NeuralCanvasEngine, PodNode } from './NeuralCanvasEngine';

export type PodType = 'folders' | 'trips' | 'timeline' | 'locations' | 'library';

export interface SelectedNodeDetail {
  type: 'trip' | 'folder' | 'photo';
  id: string;
  title: string;
  subtitle: string;
  count: number;
  dateStr: string;
  photos: PhotoItem[];
  coverUri?: string;
  cameraInfo?: string;
}

interface NeuralConstellationGraphProps {
  journeys: JourneyCluster[];
  folders: FolderAssetSource[];
  photos: PhotoItem[];
  onSelectNode: (detail: SelectedNodeDetail) => void;
  selectedNodeId?: string | null;
  onImportClick: () => void;
}

export const NeuralConstellationGraph: React.FC<NeuralConstellationGraphProps> = ({
  journeys,
  folders,
  photos,
  onSelectNode,
  selectedNodeId,
  onImportClick,
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'expanded'>('overview');
  const [activePod, setActivePod] = useState<PodType>('folders');

  const locations = Array.from(
    new Set(photos.map((p) => p.location?.city || p.location?.placeName).filter(Boolean))
  );

  // 5 Orbital Nodes strictly matching the composition of Frame 006 / 008
  const pods: (PodNode & { type: PodType; detailSub: string })[] = [
    {
      id: 'folders',
      type: 'folders',
      name: '导入文件夹',
      en: 'FOLDERS',
      detailSub: `${folders.length} 目录 scanned`,
      count: folders.length,
      icon: '◫',
      color: '#E5A93C', // Amber Gold
      cx: 220,
      cy: 230,
    },
    {
      id: 'trips',
      type: 'trips',
      name: '旅行归集',
      en: 'TRIPS',
      detailSub: `${journeys.length} 趟行程 journeys`,
      count: journeys.length,
      icon: '✈',
      color: '#38BDF8', // Sky Blue / Cyan
      cx: 780,
      cy: 210,
    },
    {
      id: 'library',
      type: 'library',
      name: '相册原图',
      en: 'PHOTOS',
      detailSub: `${photos.length} 张原片 raw`,
      count: photos.length,
      icon: '❖',
      color: '#F8FAFC', // Luminous Platinum
      cx: 500,
      cy: 90,
    },
    {
      id: 'locations',
      type: 'locations',
      name: '足迹分布',
      en: 'CITIES',
      detailSub: `${locations.length} 处坐标 geo`,
      count: locations.length,
      icon: '📍',
      color: '#EC4899', // Electric Rose
      cx: 260,
      cy: 440,
    },
    {
      id: 'timeline',
      type: 'timeline',
      name: '时间档案',
      en: 'TIMELINE',
      detailSub: '按时序流聚合 chronos',
      count: photos.length > 0 ? 1 : 0,
      icon: '⏳',
      color: '#A855F7', // Deep Violet
      cx: 740,
      cy: 430,
    },
  ];

  // Dynamic branch items based on active pod
  const branchItems = React.useMemo(() => {
    if (activePod === 'folders') {
      return folders.map((f) => {
        const fPhotos = photos.filter((p) => p.folderName === f.name);
        return {
          id: f.id,
          title: f.name,
          subtitle: `${fPhotos.length} 张照片 · 本地目录`,
          tag: 'FOLDER',
          count: fPhotos.length,
          dateStr: new Date(f.lastScannedTime).toLocaleDateString('zh-CN'),
          photos: fPhotos,
          coverUri: fPhotos[0]?.uri,
          cameraInfo: fPhotos[0]?.exif?.model || '已导入目录',
          type: 'folder' as const,
        };
      });
    } else if (activePod === 'trips') {
      return journeys.map((j) => ({
        id: j.id,
        title: j.title,
        subtitle: `${j.totalCount} 张照片 · ${j.dateRange.formatted}`,
        tag: 'TRIP',
        count: j.totalCount,
        dateStr: j.dateRange.formatted,
        photos: j.photos,
        coverUri: j.heroPhoto?.uri,
        cameraInfo: j.heroPhoto?.exif?.model,
        type: 'trip' as const,
      }));
    } else if (activePod === 'locations') {
      return locations.map((loc, idx) => {
        const lPhotos = photos.filter(
          (p) => (p.location?.city || p.location?.placeName) === loc
        );
        return {
          id: `loc-${idx}`,
          title: loc as string,
          subtitle: `${lPhotos.length} 张足迹照片`,
          tag: 'CITY',
          count: lPhotos.length,
          dateStr: '地理定位',
          photos: lPhotos,
          coverUri: lPhotos[0]?.uri,
          cameraInfo: lPhotos[0]?.location?.country,
          type: 'trip' as const,
        };
      });
    } else {
      return photos.slice(0, 30).map((p) => ({
        id: p.id,
        title: p.filename,
        subtitle: `${p.width || 4032}×${p.height || 3024} · ${p.exif?.model || 'RAW原片'}`,
        tag: 'PHOTO',
        count: 1,
        dateStr: new Date(p.creationTime).toLocaleDateString('zh-CN'),
        photos: [p],
        coverUri: p.uri,
        cameraInfo: p.exif?.model,
        type: 'photo' as const,
      }));
    }
  }, [activePod, folders, journeys, locations, photos]);

  const handlePodPress = (podId: PodType) => {
    setActivePod(podId);
    setViewMode('expanded');
  };

  return (
    <View style={styles.container}>
      {/* 60FPS Hardware Accelerated Neural Canvas (3D Geodesic Sphere, Accretion Particles, Jellyfish) */}
      <NeuralCanvasEngine
        viewMode={viewMode}
        activePodId={activePod}
        pods={pods}
        branchCount={branchItems.length}
      />

      {/* Top Cyber Breadcrumb Navigation */}
      <View style={styles.breadcrumbBar}>
        <TouchableOpacity
          onPress={() => setViewMode('overview')}
          activeOpacity={0.7}
          style={styles.breadcrumbItem}
        >
          <Text
            style={[
              styles.breadcrumbRoot,
              viewMode === 'overview' && styles.breadcrumbActive,
            ]}
          >
            {`< 创作空间 Core`}
          </Text>
        </TouchableOpacity>

        {viewMode === 'expanded' && (
          <>
            <Text style={styles.breadcrumbDivider}>/</Text>
            <TouchableOpacity
              onPress={() => setViewMode('expanded')}
              activeOpacity={0.7}
              style={styles.breadcrumbItem}
            >
              <Text style={styles.breadcrumbCurrent}>
                {pods.find((p) => p.id === activePod)?.name}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {viewMode === 'expanded' && selectedNodeId && (
          <>
            <Text style={styles.breadcrumbDivider}>/</Text>
            <Text numberOfLines={1} style={styles.breadcrumbSelected}>
              {branchItems.find((b) => b.id === selectedNodeId)?.title || '详细项'}
            </Text>
          </>
        )}

        <View style={{ flex: 1 }} />

        {/* Mode Toggle Pills in Top Right */}
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            style={[
              styles.viewToggleBtn,
              viewMode === 'overview' && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode('overview')}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'overview' && styles.viewToggleTextActive,
              ]}
            >
              星系总览
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleBtn,
              viewMode === 'expanded' && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode('expanded')}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'expanded' && styles.viewToggleTextActive,
              ]}
            >
              分支拓扑
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VIEW A: GALAXY OVERVIEW (Frame 006 / 008) */}
      {viewMode === 'overview' ? (
        <View style={styles.galaxyStage} pointerEvents="box-none">
          {/* 5 Sleek Frosted Glass HUD Capsule Cards Floating Beneath Water Jellyfish */}
          {pods.map((pod) => (
            <TouchableOpacity
              key={`pod-${pod.id}`}
              activeOpacity={0.85}
              onPress={() => handlePodPress(pod.type)}
              style={[
                styles.jellyfishNodeWrapper,
                {
                  left: `${(pod.cx / 1000) * 100}%`,
                  top: `${(pod.cy / 600) * 100}%`,
                },
              ]}
            >
              <View style={[styles.hudPillCard, { borderColor: pod.color }]}>
                <View style={styles.hudPillHeader}>
                  <Text style={[styles.hudPillIcon, { color: pod.color }]}>{pod.icon}</Text>
                  <Text style={styles.hudPillCount}>{pod.count}</Text>
                </View>
                <Text style={styles.hudPillName}>{pod.name}</Text>
                <Text style={styles.hudPillSub}>{pod.detailSub}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Central Hint Prompt if empty */}
          {photos.length === 0 && folders.length === 0 && (
            <View style={styles.emptyCenterPrompt}>
              <Text style={styles.emptyPromptTitle}>图谱总览已就绪</Text>
              <Text style={styles.emptyPromptSubtitle}>
                轻触上方任意生物节点，或点击右上角「＋ 导入文件夹」
              </Text>
              <TouchableOpacity
                onPress={onImportClick}
                style={styles.emptyImportBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyImportBtnText}>＋ 导入相册照片目录</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Floating Brand Label in Bottom Left (Matching XUAN NEURAL) */}
          <View style={styles.brandCorner}>
            <Text style={styles.brandTitle}>图库中</Text>
            <Text style={styles.brandSub}>TUKUZHONG NEURAL</Text>
          </View>
        </View>
      ) : (
        /* VIEW B: EXPANDED BRANCH FAN-OUT VIEW (Frame 016 / 020) */
        <View style={styles.expandedStage} pointerEvents="box-none">
          {/* Left Vertical Pods Selector Stack */}
          <View style={styles.podSelectorColumn}>
            {pods.map((pod) => {
              const isActive = activePod === pod.id;
              return (
                <TouchableOpacity
                  key={`sel-${pod.id}`}
                  activeOpacity={0.85}
                  onPress={() => setActivePod(pod.type)}
                  style={[
                    styles.podSelectorItem,
                    isActive && [styles.podSelectorItemActive, { borderColor: pod.color }],
                  ]}
                >
                  <View style={styles.podSelTop}>
                    <Text style={[styles.podSelIcon, { color: pod.color }]}>{pod.icon}</Text>
                    <Text style={styles.podSelCount}>{pod.count}</Text>
                  </View>
                  <Text style={styles.podSelLabel}>{pod.name}</Text>
                  <Text style={styles.podSelSub}>{pod.en}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Spacer for Canvas Bezier Ribbons */}
          <View style={styles.branchLinesArea} />

          {/* Right Branch Items Column (Matching Frame 016 & 020) */}
          <ScrollView
            style={styles.branchListContainer}
            contentContainerStyle={styles.branchListContent}
            showsVerticalScrollIndicator={false}
          >
            {branchItems.length > 0 ? (
              branchItems.map((item) => {
                const isSelected = selectedNodeId === item.id;
                return (
                  <TouchableOpacity
                    key={`item-${item.id}`}
                    activeOpacity={0.85}
                    onPress={() =>
                      onSelectNode({
                        type: item.type,
                        id: item.id,
                        title: item.title,
                        subtitle: item.subtitle,
                        count: item.count,
                        dateStr: item.dateStr,
                        photos: item.photos,
                        coverUri: item.coverUri,
                        cameraInfo: item.cameraInfo,
                      })
                    }
                    style={[
                      styles.branchCard,
                      isSelected && styles.branchCardSelected,
                    ]}
                  >
                    <View style={styles.branchCardLeft}>
                      <Text
                        numberOfLines={1}
                        style={[styles.branchCardTitle, isSelected && { color: '#38BDF8' }]}
                      >
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.branchCardSub}>
                        {item.subtitle}
                      </Text>
                    </View>

                    <View style={styles.branchCardRight}>
                      <View style={styles.branchTagBadge}>
                        <Text style={styles.branchTagText}>{item.tag}</Text>
                      </View>
                      <Text style={styles.branchArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyBranchCard}>
                <Text style={styles.emptyBranchTitle}>当前节点暂无数据</Text>
                <Text style={styles.emptyBranchSub}>
                  轻触下方按钮导入本地硬盘/相机文件夹，或选择其他节点
                </Text>
                <TouchableOpacity
                  onPress={onImportClick}
                  style={styles.emptyImportBtnMini}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyImportBtnMiniText}>＋ 立即导入</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    position: 'relative',
    overflow: 'hidden',
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
    zIndex: 20,
  },
  breadcrumbItem: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  breadcrumbRoot: {
    fontSize: 13,
    color: '#8E95A5',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  breadcrumbActive: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  breadcrumbDivider: {
    fontSize: 13,
    color: '#475569',
    marginHorizontal: 4,
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  breadcrumbSelected: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
    maxWidth: 240,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  viewToggleBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  viewToggleText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  viewToggleTextActive: {
    color: '#FDE047',
    fontWeight: '700',
  },

  // Overview Layout
  galaxyStage: {
    flex: 1,
    position: 'relative',
  },
  jellyfishNodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -70 }, { translateY: 0 }],
    zIndex: 10,
  },
  hudPillCard: {
    width: 140,
    backgroundColor: 'rgba(11, 15, 25, 0.82)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  hudPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hudPillIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  hudPillCount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hudPillName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  hudPillSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  emptyCenterPrompt: {
    position: 'absolute',
    left: '50%',
    top: '72%',
    transform: [{ translateX: -160 }, { translateY: 0 }],
    width: 320,
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    alignItems: 'center',
    zIndex: 15,
  },
  emptyPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  emptyPromptSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  emptyImportBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyImportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0D14',
  },
  brandCorner: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    zIndex: 10,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Expanded Layout
  expandedStage: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  podSelectorColumn: {
    width: 140,
    justifyContent: 'flex-start',
    gap: 12,
    paddingTop: 16,
  },
  podSelectorItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  podSelectorItemActive: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  podSelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  podSelIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  podSelCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  podSelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  podSelSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.4,
  },

  branchLinesArea: {
    width: 130, // Space allocated for Canvas Bezier Ribbons
  },
  branchListContainer: {
    flex: 1,
    maxWidth: 520,
  },
  branchListContent: {
    paddingVertical: 16,
    gap: 10,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  branchCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(15, 30, 50, 0.95)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  branchCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  branchCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  branchCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  branchCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchTagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  branchTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  branchArrow: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBranchCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyBranchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  emptyBranchSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyImportBtnMini: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  emptyImportBtnMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#07090E',
  },
});
