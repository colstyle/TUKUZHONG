import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { JourneyCluster } from '../types/journey';
import { useTheme } from '../theme/context';

interface TripHeroCardProps {
  journey: JourneyCluster;
  onPress: () => void;
  index: number;
}

export const TripHeroCard: React.FC<TripHeroCardProps> = ({ journey, onPress, index }) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      {/* Hero Cover Image */}
      <View style={styles.imageContainer}>
        {journey.heroPhoto ? (
          <Image
            source={{ uri: journey.heroPhoto.uri }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: theme.colors.surface }]} />
        )}

        {/* Ambient Dark Gradient Vignette */}
        <View style={styles.vignetteOverlay} />

        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          <View style={[styles.tagBadge, { backgroundColor: theme.colors.surfaceGlass }]}>
            <View style={[styles.accentDot, { backgroundColor: theme.colors.accent }]} />
            <Text style={[styles.tagText, { color: theme.colors.textPrimary }]}>
              {journey.curationTag || '旅途专刊'}
            </Text>
          </View>

          <View style={[styles.countBadge, { backgroundColor: theme.colors.surfaceGlass }]}>
            <Text style={[styles.countText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontMono }]}>
              {journey.totalCount} 帧
            </Text>
          </View>
        </View>

        {/* Bottom Title & Narrative Plate */}
        <View style={styles.bottomMeta}>
          <Text style={[styles.journeyDate, { color: theme.colors.accent, fontFamily: theme.typography.fontMono }]}>
            {journey.dateRange.formatted} · 共 {journey.dateRange.durationDays} 天
          </Text>

          <Text
            numberOfLines={1}
            style={[styles.journeyTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontSerif }]}
          >
            {journey.title}
          </Text>

          <Text numberOfLines={1} style={[styles.journeySubtitle, { color: theme.colors.textSecondary }]}>
            {journey.subtitle}
          </Text>

          {/* Highlights Mini Strip Preview */}
          {journey.highlightPhotos.length > 1 && (
            <View style={styles.miniStripRow}>
              {journey.highlightPhotos.slice(1, 5).map((photo, i) => (
                <Image
                  key={`mini-${photo.id}-${i}`}
                  source={{ uri: photo.uri }}
                  style={[styles.miniThumb, { borderColor: theme.colors.borderSubtle }]}
                  resizeMode="cover"
                />
              ))}
              {journey.totalCount > 5 && (
                <View style={[styles.moreThumb, { backgroundColor: theme.colors.surfaceGlass, borderColor: theme.colors.borderSubtle }]}>
                  <Text style={[styles.moreText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontMono }]}>
                    +{journey.totalCount - 4}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: 420,
    position: 'relative',
    justifyContent: 'space-between',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    ...StyleSheet.absoluteFill,
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 7, 9, 0.45)',
  },
  topBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 2,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomMeta: {
    padding: 20,
    zIndex: 2,
  },
  journeyDate: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '500',
  },
  journeyTitle: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  journeySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  miniStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  miniThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  moreThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
