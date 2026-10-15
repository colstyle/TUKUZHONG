import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface BottomHudConsoleProps {
  totalPhotos: number;
  totalTrips: number;
  totalFolders: number;
  totalFiltered: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTag: (tag: string) => void;
}

export const BottomHudConsole: React.FC<BottomHudConsoleProps> = ({
  totalPhotos,
  totalTrips,
  totalFolders,
  totalFiltered,
  searchQuery,
  onSearchChange,
  onSelectTag,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Metrics Row (Matching UI.mp4 frame_008) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>照片总数 Photos</Text>
          <Text style={styles.metricNum}>{totalPhotos}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>旅行归集 Trips</Text>
          <Text style={styles.metricNum}>{totalTrips}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>导入目录 Folders</Text>
          <Text style={styles.metricNum}>{totalFolders}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>已去杂项 Filtered</Text>
          <Text style={styles.metricNum}>{totalFiltered}</Text>
        </View>
      </View>

      {/* Search Input Bar (Matching UI.mp4 bottom search) */}
      <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="检索相册、城市足迹、日期、相机型号..."
          placeholderTextColor="#555562"
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <TouchableOpacity
          style={styles.searchSubmitBtn}
          onPress={() => {}}
          activeOpacity={0.8}
        >
          <Text style={styles.searchArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filter Pills (Clean generic categories, no mock names) */}
      <View style={styles.quickTagsRow}>
        <TouchableOpacity
          onPress={() => onSelectTag('')}
          style={styles.tagPill}
          activeOpacity={0.7}
        >
          <Text style={styles.tagPillText}>◇ 全部图谱</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectTag('文件夹')}
          style={styles.tagPill}
          activeOpacity={0.7}
        >
          <Text style={styles.tagPillText}>导入文件夹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectTag('旅行')}
          style={styles.tagPill}
          activeOpacity={0.7}
        >
          <Text style={styles.tagPillText}>旅行聚类</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectTag('原图')}
          style={styles.tagPill}
          activeOpacity={0.7}
        >
          <Text style={styles.tagPillText}>原片精选</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(14, 14, 18, 0.92)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 30,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    color: '#6E6E7C',
    fontSize: 9,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  metricNum: {
    color: '#F4F4F6',
    fontSize: 16,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  searchBarFocused: {
    borderColor: 'rgba(229, 169, 60, 0.6)',
  },
  input: {
    flex: 1,
    color: '#F4F4F6',
    fontSize: 12,
    paddingVertical: 4,
  },
  searchSubmitBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchArrow: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  quickTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tagPillText: {
    color: '#8A8A96',
    fontSize: 10,
  },
});
