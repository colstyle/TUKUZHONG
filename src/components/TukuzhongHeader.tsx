import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export type MainTabType = 'graph' | 'library' | 'folders' | 'timeline';

interface TukuzhongHeaderProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onImportFolder: () => void;
  isFilterScreenshots: boolean;
  onToggleFilterScreenshots: () => void;
}

export const TukuzhongHeader: React.FC<TukuzhongHeaderProps> = ({
  activeTab,
  onSelectTab,
  onImportFolder,
  isFilterScreenshots,
  onToggleFilterScreenshots,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Top Main Navigation Bar */}
      <View style={styles.topRow}>
        {/* Left: Brand "图库中" */}
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <View style={styles.logoCore} />
          </View>
          <View>
            <Text style={styles.brandTitle}>图库中</Text>
            <Text style={styles.brandTag}>TUKUZHONG</Text>
          </View>
        </View>

        {/* Center: Segmented Navigation Pills (Matching UI.mp4) */}
        <View style={styles.navSegmentContainer}>
          <TouchableOpacity
            style={[styles.navPill, activeTab === 'graph' && styles.navPillActive]}
            onPress={() => onSelectTab('graph')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navPillText, activeTab === 'graph' && styles.navPillTextActive]}>
              图谱 GRAPH
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navPill, activeTab === 'library' && styles.navPillActive]}
            onPress={() => onSelectTab('library')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navPillText, activeTab === 'library' && styles.navPillTextActive]}>
              相册 LIBRARY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navPill, activeTab === 'folders' && styles.navPillActive]}
            onPress={() => onSelectTab('folders')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navPillText, activeTab === 'folders' && styles.navPillTextActive]}>
              文件夹 FOLDERS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navPill, activeTab === 'timeline' && styles.navPillActive]}
            onPress={() => onSelectTab('timeline')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navPillText, activeTab === 'timeline' && styles.navPillTextActive]}>
              时间线 TIMELINE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[styles.filterBtn, isFilterScreenshots && styles.filterBtnActive]}
            onPress={onToggleFilterScreenshots}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterBtnText, isFilterScreenshots && styles.filterBtnTextActive]}>
              {isFilterScreenshots ? '已去杂项' : '包含杂项'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importBtn}
            onPress={onImportFolder}
            activeOpacity={0.85}
          >
            <Text style={styles.importBtnText}>＋ 导入文件夹</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#08080B',
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#16161D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5A93C', // Amber warm core
    shadowColor: '#E5A93C',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  brandTitle: {
    color: '#F4F4F6',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  brandTag: {
    color: '#6E6E78',
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  navSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  navPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  navPillActive: {
    backgroundColor: '#1E1E26',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navPillText: {
    color: '#7A7A88',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  navPillTextActive: {
    color: '#F4F4F6',
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterBtnActive: {
    borderColor: 'rgba(229, 169, 60, 0.4)',
    backgroundColor: 'rgba(229, 169, 60, 0.08)',
  },
  filterBtnText: {
    color: '#8A8A96',
    fontSize: 11,
  },
  filterBtnTextActive: {
    color: '#E5A93C',
  },
  importBtn: {
    backgroundColor: '#EDEDF2',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  importBtnText: {
    color: '#08080B',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
