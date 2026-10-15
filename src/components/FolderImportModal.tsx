import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { FolderAssetSource, PhotoItem } from '../types/photo';
import { pickFolderOrFiles } from '../services/folderImporter';
import { useTheme } from '../theme/context';

interface FolderImportModalProps {
  visible: boolean;
  onClose: () => void;
  folderSources: FolderAssetSource[];
  onPhotosImported: (folderName: string, newPhotos: PhotoItem[], folderId?: string) => void;
  onRemoveFolder?: (folderId: string) => void;
}

export const FolderImportModal: React.FC<FolderImportModalProps> = ({
  visible,
  onClose,
  folderSources,
  onPhotosImported,
  onRemoveFolder,
}) => {
  const { theme } = useTheme();
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handlePickFolder = async () => {
    try {
      setIsImporting(true);
      setImportStatus('正在扫描所选目录中的图片、视频与摄影参数...');
      const result = await pickFolderOrFiles();

      if (result && result.photos.length > 0) {
        setImportStatus(`成功导入 ${result.photos.length} 项作品至「${result.folderName}」`);
        onPhotosImported(result.folderName, result.photos, result.folderId);
        setTimeout(() => {
          setIsImporting(false);
          setImportStatus(null);
          onClose();
        }, 800);
      } else {
        setIsImporting(false);
        setImportStatus(null);
      }
    } catch (err: any) {
      setIsImporting(false);
      setImportStatus(`导入失败: ${err.message || '未知错误'}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSubtle }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontSerif }]}>
                影集与文件夹管理
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                直接导入微单 SD 卡、相机备份或本地指定目录
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.colors.surface }]}>
              <Text style={{ color: '#AAA', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Import Action Hero Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePickFolder}
            disabled={isImporting}
            style={[styles.importActionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent }]}
          >
            {isImporting ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.accent }]}>{importStatus}</Text>
              </View>
            ) : (
              <View style={styles.importRow}>
                <View style={[styles.plusCircle, { backgroundColor: theme.colors.accentDim }]}>
                  <Text style={[styles.plusIcon, { color: theme.colors.accent }]}>＋</Text>
                </View>
                <View style={styles.importMeta}>
                  <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
                    选择新文件夹导入
                  </Text>
                  <Text style={[styles.actionDesc, { color: theme.colors.textTertiary }]}>
                    支持批量读取 JPG, PNG, RAW, HEIC 摄影原片
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Existing Folder Sources List */}
          <Text style={[styles.listHeader, { color: theme.colors.textTertiary, fontFamily: theme.typography.fontMono }]}>
            已导入的独立影集 ({folderSources.length})
          </Text>

          <ScrollView style={styles.folderList} showsVerticalScrollIndicator={false}>
            {folderSources.length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={[styles.emptyHint, { color: theme.colors.textTertiary }]}>
                  暂未添加外部文件夹。系统相册照片会自动在主页按旅途聚类展示。
                </Text>
              </View>
            ) : (
              folderSources.map((folder) => (
                <View
                  key={folder.id}
                  style={[styles.folderItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle }]}
                >
                  <View style={styles.folderItemLeft}>
                    <Text style={styles.folderIcon}>📁</Text>
                    <View>
                      <Text style={[styles.folderItemName, { color: theme.colors.textPrimary }]}>
                        {folder.name}
                      </Text>
                      <Text style={[styles.folderItemCount, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontMono }]}>
                        {folder.photoCount} 张摄影作品 · {new Date(folder.lastScannedTime).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                  </View>

                  {onRemoveFolder && (
                    <TouchableOpacity
                      onPress={() => onRemoveFolder(folder.id)}
                      style={styles.removeBtn}
                    >
                      <Text style={{ color: '#666', fontSize: 12 }}>移除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 24,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importActionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
  },
  importMeta: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 11,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  listHeader: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  folderList: {
    maxHeight: 260,
  },
  emptyList: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  folderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderIcon: {
    fontSize: 22,
  },
  folderItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  folderItemCount: {
    fontSize: 10,
  },
  removeBtn: {
    padding: 6,
  },
});
