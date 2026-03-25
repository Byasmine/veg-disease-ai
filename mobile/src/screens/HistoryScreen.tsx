import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import Toast from 'react-native-toast-message';
import { getScans, clearHistory, type ScanHistoryEntry } from '../services/history';
import { clearAllStoredData } from '../services/api';
import { IconLeaf } from '../components/Icons';
import { navigateRoot } from '../navigation/navigationRef';

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  } catch {
    return iso;
  }
}

export function HistoryScreen() {
  const [list, setList] = useState<ScanHistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const scans = await getScans();
    setList(scans);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const runClear = useCallback(async () => {
    try {
      await clearAllStoredData();
      Toast.show({
        type: 'success',
        text1: 'Cleared',
        text2: 'Local history and server data (including Cloudinary) have been cleared.',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Server clear failed',
        text2: e instanceof Error ? e.message : 'Could not clear server data. Local history will still be cleared.',
      });
    }
    await clearHistory();
    setList([]);
  }, []);

  const handleClear = useCallback(() => {
    const message = 'Remove all scan history on this device and delete all stored feedback data and images from the server (including Cloudinary)?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        runClear();
      }
      return;
    }
    Alert.alert('Clear everything', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear everything', style: 'destructive', onPress: runClear },
    ]);
  }, [runClear]);

  const renderItem = ({ item }: { item: ScanHistoryEntry }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={() => navigateRoot('HistoryDetail', { scanId: item.id })}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <IconLeaf size={28} color={colors.taupe} />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowLabel} numberOfLines={1}>{formatLabel(item.prediction)}</Text>
        <Text style={styles.rowMeta}>
          {formatDate(item.timestamp)} · {Math.round(item.confidence * 100)}%
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Scan history</Text>
        <Text style={styles.subtitle}>Plants you’ve scanned on this device</Text>
        {list.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.clearBtnText}>Clear everything</Text>
          </TouchableOpacity>
        )}
      </View>
      {list.length === 0 ? (
        <View style={styles.empty}>
          <IconLeaf size={56} color={colors.taupe} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySub}>Scan a leaf from the home screen to see history here.</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.olive} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  clearBtnText: { fontSize: 14, color: colors.danger, fontWeight: '600' },
  list: { paddingHorizontal: 24, paddingBottom: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, marginLeft: 14 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
});
