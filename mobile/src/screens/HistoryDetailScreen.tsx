import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { getScans } from '../services/history';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { showErrorToast } from '../utils/showApiError';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryDetail'>;

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function HistoryDetailScreen({ route, navigation }: Props) {
  const { scanId } = route.params;
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<Awaited<ReturnType<typeof getScans>>[number] | null>(null);

  const confidencePct = useMemo(() => {
    const c = entry?.confidence ?? 0;
    return `${Math.round(c * 100)}%`;
  }, [entry?.confidence]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const scans = await getScans();
        const found = scans.find((s) => s.id === scanId) ?? null;
        if (!cancelled) setEntry(found);
      } catch (e) {
        showErrorToast(e, { title: 'Could not load scan', fallback: 'Please try again.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const statusColor = useMemo(() => {
    const s = (entry?.status ?? '').toLowerCase();
    if (s === 'success') return colors.success;
    if (s === 'uncertain') return colors.warning;
    return colors.danger;
  }, [entry?.status]);

  const imageUri = entry?.imageUri ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBarSpacer />
      <Animated.View entering={FadeInDown.duration(250)}>
        <View style={styles.titleRow}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '12', borderColor: statusColor + '33' }]}>
            <Ionicons name="checkmark-circle" size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{(entry?.status ?? '—').toUpperCase()}</Text>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.olive} />
          <Text style={styles.loadingText}>Loading scan…</Text>
        </View>
      ) : entry ? (
        <>
          <GlassCard style={styles.card}>
            <View style={styles.imageWrap}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="leaf-outline" size={42} color={colors.textSecondary} />
                </View>
              )}
            </View>

            <Text style={styles.predictionTitle}>{formatLabel(entry.prediction)}</Text>
            <Text style={styles.metaLine}>
              Confidence: <Text style={{ color: colors.olive, fontWeight: '800' }}>{confidencePct}</Text>
            </Text>
            <Text style={styles.metaLine}>Date: {formatDate(entry.timestamp)}</Text>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Next</Text>
            <Text style={styles.sectionText}>
              You can return to scan another leaf anytime from the Analyze tab.
            </Text>
          </GlassCard>
        </>
      ) : (
        <GlassCard style={styles.card}>
          <Text style={styles.sectionText}>Scan not found on this device.</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

function StatusBarSpacer() {
  // Small padding to avoid the header overlap on Android.
  return <View style={{ height: 4 }} />;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  statusPill: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusText: { fontWeight: '900', fontSize: 12 },
  loadingWrap: { paddingVertical: 36, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.textSecondary, fontWeight: '700' },
  card: {},
  imageWrap: { width: '100%', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  image: { width: '100%', height: 240 },
  imagePlaceholder: { width: '100%', height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EBE3' },
  predictionTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginTop: 14 },
  metaLine: { marginTop: 6, color: colors.textSecondary, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 },
  sectionText: { fontSize: 14, color: colors.textSecondary, fontWeight: '700', lineHeight: 21 },
});

