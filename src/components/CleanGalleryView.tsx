import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { PhotoItem } from '../types/photo';

interface CleanGalleryViewProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem, index: number) => void;
  onBack?: () => void;
}

export const CleanGalleryView: React.FC<CleanGalleryViewProps> = ({
  title,
  subtitle,
  photos,
  onSelectPhoto,
  onBack,
}) => {
  const screenWidth = Dimensions.get('window').width;
  // Responsive columns
  const numColumns = screenWidth > 900 ? 5 : screenWidth > 600 ? 4 : 3;
  const itemSize = (screenWidth - 32 - (numColumns - 1) * 8) / numColumns;

  return (
    <View style={styles.container}>
      {/* Clean Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backText}>返回图谱</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.photoCountBadge}>{photos.length} 帧</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Grid Body */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id || index}
              activeOpacity={0.88}
              onPress={() => onSelectPhoto(photo, index)}
              style={[styles.photoCard, { width: itemSize, height: itemSize }]}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoImage} resizeMode="cover" />
              {/* Optional tiny focal/shutter tag on hover/corner */}
              {photo.exif?.focalLength && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{photo.exif.focalLength}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  backIcon: {
    color: '#E5A93C',
    fontSize: 18,
    lineHeight: 20,
  },
  backText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#F4F4F6',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  photoCountBadge: {
    color: '#8A8A96',
    fontSize: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subtitle: {
    color: '#8A8A96',
    fontSize: 12,
    marginTop: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCard: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#16161D',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  metaPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metaPillText: {
    color: '#DDD',
    fontSize: 9,
  },
});
