import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../theme/context';

interface GalleryHeaderProps {
  onImportFolder: () => void;
  onToggleFilterScreenshots?: () => void;
  isFilterScreenshotsActive?: boolean;
  activeJourneyTitle?: string;
  onBackToJourneys?: () => void;
  showcaseMode?: 'editorial' | 'darkroom' | 'filmstrip';
  onSelectShowcaseMode?: (mode: 'editorial' | 'darkroom' | 'filmstrip') => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  onImportFolder,
  onToggleFilterScreenshots,
  isFilterScreenshotsActive = true,
  activeJourneyTitle,
  onBackToJourneys,
  showcaseMode = 'editorial',
  onSelectShowcaseMode,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.colors.canvas }]}>
      {/* Top subtle branding row */}
      <View style={styles.topRow}>
        {activeJourneyTitle ? (
          <TouchableOpacity
            onPress={onBackToJourneys}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.backIconText, { color: theme.colors.textPrimary }]}>‹</Text>
            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>全部旅程</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            <View style={[styles.leicaDot, { backgroundColor: theme.colors.accentRed }]} />
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontSerif }]}>
              Tukuzhong
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.colors.accent }]}>CURATOR</Text>
          </View>
        )}

        {/* Action icons */}
        <View style={styles.actionRow}>
          {/* Screenshot filter toggle */}
          {onToggleFilterScreenshots && (
            <TouchableOpacity
              onPress={onToggleFilterScreenshots}
              activeOpacity={0.7}
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isFilterScreenshotsActive ? theme.colors.accentDim : theme.colors.surface,
                  borderColor: isFilterScreenshotsActive ? theme.colors.accent : theme.colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: isFilterScreenshotsActive ? theme.colors.accent : theme.colors.textSecondary }]}>
                {isFilterScreenshotsActive ? '纯净画廊 ON' : '含杂项'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Import Folder button */}
          <TouchableOpacity
            onPress={onImportFolder}
            activeOpacity={0.8}
            style={[styles.importButton, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSubtle }]}
          >
            <Text style={[styles.importIcon, { color: theme.colors.accent }]}>＋</Text>
            <Text style={[styles.importText, { color: theme.colors.textPrimary }]}>导入文件夹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode switcher tabs (when viewing a journey or main stream) */}
      {onSelectShowcaseMode && (
        <View style={[styles.tabBar, { borderBottomColor: theme.colors.borderSubtle }]}>
          <TouchableOpacity
            onPress={() => onSelectShowcaseMode('editorial')}
            style={[
              styles.tabItem,
              showcaseMode === 'editorial' && [styles.activeTab, { borderBottomColor: theme.colors.accent }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: showcaseMode === 'editorial' ? theme.colors.textPrimary : theme.colors.textTertiary,
                  fontWeight: showcaseMode === 'editorial' ? '600' : '400',
                },
              ]}
            >
              画刊编排 (Editorial)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectShowcaseMode('darkroom')}
            style={[
              styles.tabItem,
              showcaseMode === 'darkroom' && [styles.activeTab, { borderBottomColor: theme.colors.accent }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: showcaseMode === 'darkroom' ? theme.colors.textPrimary : theme.colors.textTertiary,
                  fontWeight: showcaseMode === 'darkroom' ? '600' : '400',
                },
              ]}
            >
              沉浸暗室 (Zen Gallery)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectShowcaseMode('filmstrip')}
            style={[
              styles.tabItem,
              showcaseMode === 'filmstrip' && [styles.activeTab, { borderBottomColor: theme.colors.accent }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: showcaseMode === 'filmstrip' ? theme.colors.textPrimary : theme.colors.textTertiary,
                  fontWeight: showcaseMode === 'filmstrip' ? '600' : '400',
                },
              ]}
            >
              胶片放映 (Filmstrip)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leicaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandTitle: {
    fontSize: 20,
    letterSpacing: 3,
    fontWeight: '700',
  },
  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
    paddingTop: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  backIconText: {
    fontSize: 20,
    lineHeight: 22,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  importIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  importText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    gap: 20,
  },
  tabItem: {
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {},
  tabText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
