import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SelectedNodeDetail } from './NeuralConstellationGraph';
import { PhotoItem } from '../types/photo';

interface InspectorDrawerProps {
  detail: SelectedNodeDetail | null;
  onClose: () => void;
  onOpenGallery: (photos: PhotoItem[], initialIndex?: number) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  detail,
  onClose,
  onOpenGallery,
}) => {
  if (!detail) return null;

  // Histogram simulation bars for exposure / frequency distribution (Frame 020)
  const histogramBars = [
    12, 18, 35, 48, 62, 85, 95, 78, 60, 45, 52, 68, 88, 72, 40, 22,
  ];

  const primaryPhoto = detail.photos[0];
  const exif = primaryPhoto?.exif;

  return (
    <View style={styles.container}>
      {/* Drawer Top Navigation & Close */}
      <View style={styles.header}>
        <View style={styles.tagRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryGlyph}>
              {detail.type === 'trip' ? '✈' : detail.type === 'folder' ? '◫' : '❖'}
            </Text>
            <Text style={styles.categoryLabel}>
              {detail.type === 'trip'
                ? '旅行归集 TRIPS'
                : detail.type === 'folder'
                ? '导入目录 FOLDERS'
                : '原图档案 RAW'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text numberOfLines={2} style={styles.nodeTitle}>
          {detail.title}
        </Text>

        <View style={styles.statusMetaRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>已就绪 READY</Text>
          </View>
          <Text style={styles.metaTimeText}>
            收录于 {detail.dateStr} · {detail.count} 张照片
          </Text>
        </View>

        {/* Primary Action Button (Matching Frame 020: 查看作品 Open in Works >) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onOpenGallery(detail.photos, 0)}
          style={styles.openGalleryBtn}
        >
          <Text style={styles.openGalleryBtnText}>
            全屏浏览原图矩阵 Open Gallery ❯
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Analytics & Telemetry Body */}
      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Exposure Luminance Distribution Histogram (Matching Frame 020) */}
        <View style={styles.histogramCard}>
          <View style={styles.histHeader}>
            <Text style={styles.histTitle}>曝光与亮度直方图 Histogram</Text>
            <Text style={styles.histSub}>DCI-P3 广色域</Text>
          </View>

          <View style={styles.histMain}>
            <Text style={styles.histValue}>
              {detail.count > 0 ? `${detail.count} 帧` : '标准动态'}
            </Text>
            <View style={styles.barsContainer}>
              {histogramBars.map((heightPct, idx) => (
                <View
                  key={`bar-${idx}`}
                  style={[
                    styles.histBar,
                    {
                      height: `${heightPct}%`,
                      backgroundColor:
                        idx > 10 ? '#38BDF8' : idx > 5 ? '#F59E0B' : '#E2E8F0',
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 4 Core Photography Telemetry Metrics (Frame 020) */}
        <View style={styles.fourMetricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricGlyph}>◎ 观看 Views</Text>
            <Text style={styles.metricVal}>{detail.count * 24 + 18}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricGlyph}>⚑ 收藏 Saves</Text>
            <Text style={styles.metricVal}>{Math.max(1, Math.floor(detail.count * 1.8))}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricGlyph}>⚡ 涨粉 Follows</Text>
            <Text style={styles.metricVal}>{Math.max(1, Math.floor(detail.count * 0.6))}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricGlyph}>∞ 双链 Mutual</Text>
            <Text style={styles.metricVal}>{detail.count > 5 ? 4 : 2}</Text>
          </View>
        </View>

        {/* Full EXIF Parameters Table (Matching Frame 020 All Metrics Table) */}
        <View style={styles.telemetryTable}>
          <Text style={styles.tableHeaderTitle}>全项遥测数据 ALL METRICS</Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>拍摄器材 Camera</Text>
            <Text style={styles.tableVal}>{exif?.model || detail.cameraInfo || 'Sony A7R V'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>镜头型号 Lens</Text>
            <Text style={styles.tableVal}>{exif?.lens || 'FE 24-70mm F2.8 GM II'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>光圈与快门 Exposure</Text>
            <Text style={styles.tableVal}>
              {exif?.aperture || 'f/2.8'} · {exif?.shutterSpeed || '1/500s'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>感光度 ISO</Text>
            <Text style={styles.tableVal}>ISO {exif?.iso || 100}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>焦距范围 Focal</Text>
            <Text style={styles.tableVal}>{exif?.focalLength || '35mm'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>分辨率 Dimensions</Text>
            <Text style={styles.tableVal}>
              {primaryPhoto ? `${primaryPhoto.width} × ${primaryPhoto.height}` : '9504 × 6336 (61 MP)'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>色彩空间 Color</Text>
            <Text style={styles.tableVal}>Adobe RGB (1998) / RAW</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableKey}>存储路径 Path</Text>
            <Text numberOfLines={1} style={styles.tableVal}>
              {detail.type === 'folder' ? detail.title : `/DCIM/${detail.title}`}
            </Text>
          </View>
        </View>

        {/* Thumbnail Preview strip if photos exist */}
        {detail.photos.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>
              原片缩略 PREVIEW ({detail.photos.length})
            </Text>
            <View style={styles.photoGrid}>
              {detail.photos.slice(0, 6).map((p, idx) => (
                <TouchableOpacity
                  key={`thumb-${p.id || idx}`}
                  onPress={() => onOpenGallery(detail.photos, idx)}
                  style={styles.thumbCell}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: p.uri }} style={styles.thumbImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Ask Box (Matching Frame 020: 追问这条内容... Ask about this note) */}
      <View style={styles.bottomAskBox}>
        <View style={styles.askInputFake}>
          <Text style={styles.askPlaceholder}>
            追问这组照片... Ask about this photo
          </Text>
          <TouchableOpacity style={styles.askArrowBtn}>
            <Text style={styles.askArrowText}>→</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.askFooterLinks}>
          <Text style={styles.askLinkText}>◇ 我的图谱 My graph</Text>
          <Text style={styles.askLinkText}>本地分析 Local analysis</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 330,
    backgroundColor: '#0A0D14',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    height: '100%',
    zIndex: 40,
    flexDirection: 'column',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryGlyph: {
    fontSize: 12,
    color: '#38BDF8',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  nodeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 24,
    marginBottom: 6,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  metaTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  openGalleryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  openGalleryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },

  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Histogram Card (Frame 020)
  histogramCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
  },
  histHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  histTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  histSub: {
    fontSize: 10,
    color: '#38BDF8',
  },
  histMain: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 48,
  },
  histValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginRight: 12,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 38,
    gap: 3,
  },
  histBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },

  // Four metrics grid (Frame 020)
  fourMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
  },
  metricGlyph: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F1F5F9',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // All metrics table
  telemetryTable: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    gap: 8,
  },
  tableHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tableKey: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tableVal: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '500',
    maxWidth: 160,
    textAlign: 'right',
  },

  previewSection: {
    gap: 8,
  },
  previewSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  thumbCell: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },

  // Bottom Ask Bar
  bottomAskBox: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
  },
  askInputFake: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
  askPlaceholder: {
    fontSize: 11,
    color: '#64748B',
  },
  askArrowBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askArrowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0D14',
    lineHeight: 14,
  },
  askFooterLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  askLinkText: {
    fontSize: 10,
    color: '#64748B',
  },
});
