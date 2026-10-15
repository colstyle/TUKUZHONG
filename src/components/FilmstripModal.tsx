import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { PhotoItem } from '../types/photo';
import { useTheme } from '../theme/context';

interface FilmstripModalProps {
  visible: boolean;
  photos: PhotoItem[];
  onClose: () => void;
  onSelectPhoto: (photo: PhotoItem, index: number) => void;
}

export const FilmstripModal: React.FC<FilmstripModalProps> = ({
  visible,
  photos,
  onClose,
  onSelectPhoto,
}) => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollX = useRef(0);
  const screenWidth = Dimensions.get('window').width;

  // Auto-cruise playback effect
  useEffect(() => {
    let interval: any = null;
    if (visible && isPlaying) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          currentScrollX.current += 3;
          scrollRef.current.scrollTo({ x: currentScrollX.current, animated: false });
        }
      }, 30);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, isPlaying]);

  if (!photos || photos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#050507" />
      <View style={[styles.container, { backgroundColor: '#050507' }]}>
        {/* Top Control Bar */}
        <SafeAreaView style={styles.safeTop}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backIcon}>✕</Text>
            </TouchableOpacity>

            <View style={styles.titleGroup}>
              <Text style={[styles.filmTitle, { fontFamily: theme.typography.fontSerif }]}>
                CINEMATIC REEL
              </Text>
              <Text style={[styles.filmSub, { fontFamily: theme.typography.fontMono }]}>
                35MM CONTINUOUS STRIP · {photos.length} FRAMES
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={[
                styles.playBtn,
                {
                  backgroundColor: isPlaying ? theme.colors.accent : 'rgba(255, 255, 255, 0.12)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.playBtnText, { color: isPlaying ? '#000' : '#FFF' }]}>
                {isPlaying ? '暂停巡航 ❚❚' : '自动放映 ▶'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Filmstrip Reel Stage */}
        <View style={styles.reelContainer}>
          {/* Top Sprocket Perforations */}
          <View style={styles.sprocketRow}>
            {Array.from({ length: 40 }).map((_, i) => (
              <View key={`sprocket-top-${i}`} style={styles.sprocketHole} />
            ))}
          </View>

          {/* Continuous Film Roll ScrollView */}
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={(e) => {
              currentScrollX.current = e.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
          >
            {photos.map((photo, index) => {
              const frameNumber = String(index + 1).padStart(2, '0');
              return (
                <View key={`reel-${photo.id}-${index}`} style={styles.frameWrapper}>
                  {/* Frame Metadata Edge */}
                  <View style={styles.edgeMetaRow}>
                    <Text style={[styles.edgeText, { fontFamily: theme.typography.fontMono }]}>
                      EXP {frameNumber}A
                    </Text>
                    <Text style={[styles.edgeBrand, { fontFamily: theme.typography.fontMono }]}>
                      {photo.exif?.make || 'AURA FILM'} · {photo.exif?.iso ? `ISO ${photo.exif.iso}` : '500T'}
                    </Text>
                  </View>

                  {/* Photo Negative Frame */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => onSelectPhoto(photo, index)}
                    style={styles.negativeFrame}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.frameImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Bottom Frame Stamp */}
                  <View style={styles.frameBottomRow}>
                    <Text style={[styles.filmDateText, { fontFamily: theme.typography.fontMono }]}>
                      {new Date(photo.creationTime).toLocaleDateString('zh-CN')}
                    </Text>
                    {photo.exif?.shutterSpeed && (
                      <Text style={[styles.filmExifText, { fontFamily: theme.typography.fontMono }]}>
                        {photo.exif.shutterSpeed} {photo.exif.aperture}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Sprocket Perforations */}
          <View style={styles.sprocketRow}>
            {Array.from({ length: 40 }).map((_, i) => (
              <View key={`sprocket-bot-${i}`} style={styles.sprocketHole} />
            ))}
          </View>
        </View>

        {/* Ambient Footer */}
        <View style={styles.footerBar}>
          <Text style={[styles.hintText, { color: '#666', fontFamily: theme.typography.fontMono }]}>
            轻触任意底片可进入暗室单张深度鉴赏
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  safeTop: {
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '300',
  },
  titleGroup: {
    alignItems: 'center',
  },
  filmTitle: {
    color: '#F4F4F6',
    fontSize: 15,
    letterSpacing: 2,
    fontWeight: '600',
  },
  filmSub: {
    color: '#8A8A93',
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  playBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  playBtnText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  reelContainer: {
    marginVertical: 'auto',
    backgroundColor: '#0D0D11',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E1E24',
    paddingVertical: 12,
  },
  sprocketRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  sprocketHole: {
    width: 14,
    height: 9,
    backgroundColor: '#050507',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#24242C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 18,
    alignItems: 'center',
  },
  frameWrapper: {
    width: 290,
  },
  edgeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  edgeText: {
    color: '#D4AF37',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '600',
  },
  edgeBrand: {
    color: '#777',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  negativeFrame: {
    width: 290,
    height: 195,
    backgroundColor: '#000',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#141418',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  frameBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  filmDateText: {
    color: '#777',
    fontSize: 9,
  },
  filmExifText: {
    color: '#AAA',
    fontSize: 9,
  },
  footerBar: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
