import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { PhotoItem } from '../types/photo';
import { useTheme } from '../theme/context';

interface PhotoViewerModalProps {
  visible: boolean;
  photos: PhotoItem[];
  initialIndex: number;
  onClose: () => void;
  onDeletePhoto?: (photoId: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  photos,
  initialIndex = 0,
  onClose,
  onDeletePhoto,
}) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showExifDrawer, setShowExifDrawer] = useState(false);

  // Sync index when opening
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setShowExifDrawer(false);
    }
  }, [visible, initialIndex]);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formattedDate = new Date(currentPhoto.creationTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={[styles.darkroomBackdrop, { backgroundColor: '#000000' }]}>
        {/* Ambient Subtle Glow Layer behind photo */}
        <View style={styles.ambientGlowContainer}>
          <Image
            source={{ uri: currentPhoto.uri }}
            style={styles.ambientGlowImage}
            blurRadius={60}
          />
        </View>

        {/* Top Minimalist Header Bar */}
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <View style={styles.indexPill}>
              <Text style={[styles.indexText, { fontFamily: theme.typography.fontMono }]}>
                {currentIndex + 1} <Text style={{ color: '#555' }}>/</Text> {photos.length}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowExifDrawer(!showExifDrawer)}
                style={[
                  styles.exifTogglePill,
                  showExifDrawer && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.exifToggleText,
                    { color: showExifDrawer ? '#000' : '#FFF', fontFamily: theme.typography.fontMono },
                  ]}
                >
                  EXIF
                </Text>
              </TouchableOpacity>

              {onDeletePhoto && (
                <TouchableOpacity
                  onPress={() => {
                    const toDelete = currentPhoto;
                    const confirmMsg = `确定要从相册中移除照片「${toDelete.filename || '这幅作品'}」吗？`;
                    const confirmed = Platform.OS === 'web' ? window.confirm(confirmMsg) : true;
                    if (confirmed) {
                      onDeletePhoto(toDelete.id);
                      if (photos.length <= 1) {
                        onClose();
                      } else if (currentIndex >= photos.length - 1) {
                        setCurrentIndex(Math.max(0, currentIndex - 1));
                      }
                    }
                  }}
                  style={styles.deleteCircle}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#ff9aa8', fontSize: 13 }}>🗑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>

        {/* Center Main Stage Image or Video */}
        <View style={styles.stageContainer}>
          {currentPhoto.mediaType === 'video' ? (
            Platform.OS === 'web' ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  key={currentPhoto.id}
                  src={currentPhoto.uri}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxWidth: screenWidth * 0.95,
                    maxHeight: screenHeight * 0.72,
                    borderRadius: 8,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                    outline: 'none',
                    backgroundColor: '#000',
                  }}
                />
              </div>
            ) : (
              <Image
                source={{ uri: currentPhoto.uri }}
                style={[
                  styles.stageImage,
                  {
                    width: screenWidth,
                    height: screenHeight * 0.72,
                  },
                ]}
                resizeMode="contain"
              />
            )
          ) : (
            <Image
              source={{ uri: currentPhoto.uri }}
              style={[
                styles.stageImage,
                {
                  width: screenWidth,
                  height: screenHeight * 0.72,
                },
              ]}
              resizeMode="contain"
            />
          )}

          {/* Left / Right Navigation Touch Hotspots */}
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrev}
              style={[styles.navArrow, styles.navArrowLeft]}
              activeOpacity={0.7}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
          )}

          {currentIndex < photos.length - 1 && (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navArrow, styles.navArrowRight]}
              activeOpacity={0.7}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Filename / Date Bar (Hide when EXIF drawer is open) */}
        {!showExifDrawer && (
          <View style={styles.bottomMetaBar}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                {currentPhoto.mediaType === 'video' && (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(230, 207, 152, 0.2)', borderWidth: 1, borderColor: '#e6cf98' }}>
                    <Text style={{ color: '#e6cf98', fontSize: 10, fontFamily: theme.typography.fontMono }}>VIDEO {currentPhoto.duration ? `${currentPhoto.duration}s` : ''}</Text>
                  </View>
                )}
                <Text numberOfLines={1} style={[styles.photoTitleText, { fontFamily: theme.typography.fontSerif }]}>
                  {currentPhoto.filename}
                </Text>
              </View>
              <Text style={[styles.photoDateText, { fontFamily: theme.typography.fontMono }]}>
                {formattedDate} {currentPhoto.folderName ? `· [${currentPhoto.folderName}]` : ''}
              </Text>
            </View>

            {/* Quick jump thumbnails strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsScroll}
            >
              {photos.map((p, idx) => (
                <TouchableOpacity
                  key={`thumb-${p.id}-${idx}`}
                  onPress={() => setCurrentIndex(idx)}
                  style={[
                    styles.thumbBorder,
                    currentIndex === idx && { borderColor: theme.colors.accent, borderWidth: 2 },
                  ]}
                >
                  <Image source={{ uri: p.uri }} style={styles.thumbImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* EXIF Technical Spec Drawer */}
        {showExifDrawer && (
          <View style={[styles.exifDrawer, { backgroundColor: 'rgba(18, 18, 22, 0.95)' }]}>
            <View style={styles.exifDrawerHeader}>
              <View style={styles.exifRedBrand}>
                <View style={[styles.leicaDot, { backgroundColor: theme.colors.accentRed }]} />
                <Text style={[styles.exifPlateTitle, { fontFamily: theme.typography.fontSerif }]}>
                  {currentPhoto.exif?.make || (currentPhoto.mediaType === 'video' ? 'MOTION VIDEO' : 'OPTICAL SPECIFICATION')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowExifDrawer(false)}>
                <Text style={{ color: '#888', fontSize: 13 }}>收起</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.exifGrid}>
              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>相机机身 / CAMERA</Text>
                <Text style={styles.exifVal}>{currentPhoto.exif?.model || '未知'}</Text>
              </View>

              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>镜头 / LENS</Text>
                <Text style={styles.exifVal}>{currentPhoto.exif?.lensModel || currentPhoto.exif?.lens || currentPhoto.exif?.focalLength || '未知'}</Text>
              </View>

              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>光圈 / APERTURE</Text>
                <Text style={styles.exifVal}>{currentPhoto.exif?.aperture || '未知'}</Text>
              </View>

              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>快门速度 / SHUTTER</Text>
                <Text style={styles.exifVal}>{currentPhoto.exif?.shutterSpeed || '未知'}</Text>
              </View>

              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>感光度 / ISO</Text>
                <Text style={styles.exifVal}>{currentPhoto.exif?.iso ? `ISO ${currentPhoto.exif.iso}` : '未知'}</Text>
              </View>

              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>尺寸 / RESOLUTION</Text>
                <Text style={styles.exifVal}>
                  {currentPhoto.width && currentPhoto.height ? `${currentPhoto.width} × ${currentPhoto.height}` : '未知'}
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Text style={[styles.locationCoord, { fontFamily: theme.typography.fontMono }]}>
                {currentPhoto.location?.placeName
                  ? `📍 拍摄地点: ${currentPhoto.location.placeName}`
                  : currentPhoto.location?.city
                  ? `📍 城市: ${currentPhoto.location.city}`
                  : '📍 地理位置: 未记录 GPS (未定位)'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  darkroomBackdrop: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  ambientGlowContainer: {
    ...StyleSheet.absoluteFill,
    opacity: 0.18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlowImage: {
    width: '100%',
    height: '100%',
  },
  safeHeader: {
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
  },
  indexPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  indexText: {
    color: '#F0F0F2',
    fontSize: 12,
    letterSpacing: 1,
  },
  exifTogglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exifToggleText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  stageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stageImage: {},
  navArrow: {
    position: 'absolute',
    top: '42%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowLeft: {
    left: 16,
  },
  navArrowRight: {
    right: 16,
  },
  arrowText: {
    color: '#FFF',
    fontSize: 28,
    lineHeight: 30,
  },
  bottomMetaBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 10,
  },
  photoTitleText: {
    color: '#F4F4F6',
    fontSize: 15,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  photoDateText: {
    color: '#8A8A93',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  thumbsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  thumbBorder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  exifDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 20,
  },
  exifDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exifRedBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leicaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exifPlateTitle: {
    color: '#FFF',
    fontSize: 14,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  exifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  exifItem: {
    width: '45%',
  },
  exifLabel: {
    color: '#6E6E78',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  exifVal: {
    color: '#E4E4E8',
    fontSize: 13,
    fontWeight: '500',
  },
  locationRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  locationCoord: {
    color: '#9E9EA8',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  deleteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 115, 133, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 115, 133, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
