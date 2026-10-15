import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { PhotoItem } from '../types/photo';
import { useTheme } from '../theme/context';

interface EditorialGridProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem, index: number) => void;
}

export const EditorialGrid: React.FC<EditorialGridProps> = ({ photos, onSelectPhoto }) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>暂无照片</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
          点击右上角“导入文件夹”或授权系统相册展开画卷
        </Text>
      </View>
    );
  }

  // Group photos into rhythmic editorial chapters of 5
  const chapters: PhotoItem[][] = [];
  for (let i = 0; i < photos.length; i += 5) {
    chapters.push(photos.slice(i, i + 5));
  }

  return (
    <View style={styles.container}>
      {chapters.map((chapter, chapterIndex) => (
        <View key={`chapter-${chapterIndex}`} style={styles.chapterSection}>
          {/* Chapter header / subtle index indicator */}
          <View style={styles.chapterDivider}>
            <View style={[styles.ruleLine, { backgroundColor: theme.colors.borderSubtle }]} />
            <Text style={[styles.chapterNumber, { color: theme.colors.textTertiary, fontFamily: theme.typography.fontMono }]}>
              PLATES {String(chapterIndex * 5 + 1).padStart(2, '0')} — {String(chapterIndex * 5 + chapter.length).padStart(2, '0')}
            </Text>
            <View style={[styles.ruleLine, { backgroundColor: theme.colors.borderSubtle }]} />
          </View>

          {/* Slot 0: Big Hero Monograph Spread */}
          {chapter[0] && (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => onSelectPhoto(chapter[0], chapterIndex * 5 + 0)}
              style={[
                styles.heroSpreadCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle },
              ]}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: chapter[0].uri }}
                  style={[styles.heroImage, { aspectRatio: chapter[0].aspectRatio || 16 / 9 }]}
                  resizeMode="cover"
                />
              </View>
              {/* Bottom editorial caption plate */}
              <View style={styles.captionPlate}>
                <View style={styles.captionMain}>
                  <Text style={[styles.captionDate, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontSerif }]}>
                    {new Date(chapter[0].creationTime).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  {chapter[0].folderName && (
                    <Text style={[styles.folderBadge, { color: theme.colors.accent }]}>
                      {chapter[0].folderName}
                    </Text>
                  )}
                </View>
                {chapter[0].exif?.model && (
                  <Text style={[styles.exifBadge, { color: theme.colors.textTertiary, fontFamily: theme.typography.fontMono }]}>
                    {chapter[0].exif.model} · {chapter[0].exif.focalLength || ''} {chapter[0].exif.aperture || ''}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Slots 1 & 2: Diptych (Side-by-side with asymmetric offset) */}
          {(chapter[1] || chapter[2]) && (
            <View style={styles.diptychRow}>
              {chapter[1] && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onSelectPhoto(chapter[1], chapterIndex * 5 + 1)}
                  style={[
                    styles.diptychLeft,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle },
                  ]}
                >
                  <Image
                    source={{ uri: chapter[1].uri }}
                    style={styles.diptychImage}
                    resizeMode="cover"
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.miniCaption, { color: theme.colors.textTertiary, fontFamily: theme.typography.fontMono }]}
                  >
                    {chapter[1].filename}
                  </Text>
                </TouchableOpacity>
              )}

              {chapter[2] && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onSelectPhoto(chapter[2], chapterIndex * 5 + 2)}
                  style={[
                    styles.diptychRight,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle },
                  ]}
                >
                  <Image
                    source={{ uri: chapter[2].uri }}
                    style={styles.diptychImage}
                    resizeMode="cover"
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.miniCaption, { color: theme.colors.textTertiary, fontFamily: theme.typography.fontMono }]}
                  >
                    {chapter[2].filename}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Slot 3: Staggered Solitary Showcase (Offset left with white-space breathing room) */}
          {chapter[3] && (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => onSelectPhoto(chapter[3], chapterIndex * 5 + 3)}
              style={[
                styles.solitaryCard,
                { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSubtle },
              ]}
            >
              <Image
                source={{ uri: chapter[3].uri }}
                style={[styles.solitaryImage, { aspectRatio: chapter[3].aspectRatio || 4 / 3 }]}
                resizeMode="cover"
              />
              <View style={styles.solitaryPlate}>
                <View style={[styles.goldAccentBar, { backgroundColor: theme.colors.accent }]} />
                <Text style={[styles.solitaryFilename, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontMono }]}>
                  {chapter[3].filename}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Slot 4: Panoramic bottom anchor */}
          {chapter[4] && (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => onSelectPhoto(chapter[4], chapterIndex * 5 + 4)}
              style={[
                styles.panoramicCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle },
              ]}
            >
              <Image
                source={{ uri: chapter[4].uri }}
                style={[styles.panoramicImage, { aspectRatio: Math.max(1.3, chapter[4].aspectRatio || 1.6) }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  chapterSection: {
    marginBottom: 44,
  },
  chapterDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  ruleLine: {
    flex: 1,
    height: 1,
  },
  chapterNumber: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '500',
  },
  heroSpreadCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    maxHeight: 460,
  },
  captionPlate: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  captionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captionDate: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  folderBadge: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  exifBadge: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  diptychRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  diptychLeft: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  diptychRight: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 18, // Staggered offset for editorial rhythm
    paddingBottom: 8,
  },
  diptychImage: {
    width: '100%',
    aspectRatio: 1,
  },
  miniCaption: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  solitaryCard: {
    width: '88%',
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  solitaryImage: {
    width: '100%',
    maxHeight: 380,
  },
  solitaryPlate: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goldAccentBar: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
  },
  solitaryFilename: {
    fontSize: 11,
  },
  panoramicCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panoramicImage: {
    width: '100%',
    maxHeight: 300,
  },
});
