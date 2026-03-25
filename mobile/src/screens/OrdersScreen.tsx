import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import type { ShopOrder } from '../types/shop';
import { getShopOrders } from '../services/shopApi';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function OrdersScreen() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (source: 'initial' | 'refresh' = 'initial') => {
    if (source === 'refresh') setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getShopOrders();
      setOrders(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not load orders', text2: (e as Error)?.message });
    } finally {
      if (source === 'refresh') setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      // Keep order history fresh when user returns from Checkout.
      loadOrders();
    }, [loadOrders])
  );

  const paidCount = useMemo(
    () => orders.filter((o) => o.status.toLowerCase() === 'paid').length,
    [orders]
  );

  const paymentLabel = (method: string): string => {
    const clean = method.replace(/\uFFFD/g, '').trim();
    if (clean === 'cash-on-delivery') return 'Cash on Delivery';
    if (clean === 'simulated-card') return 'Simulated Card';
    return clean || 'Unknown';
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadOrders('refresh')}
          tintColor={colors.olive}
        />
      }
    >
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(250)}>
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.title}>Order History</Text>
              <Text style={styles.subtitle}>{orders.length} order(s)</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshChip}
              onPress={() => loadOrders('refresh')}
              disabled={refreshing || loading}
            >
              <Ionicons name="refresh" size={14} color={colors.olive} />
              <Text style={styles.refreshChipText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Paid</Text>
              <Text style={styles.statValue}>{paidCount}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{orders.length}</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(250)}>
        {orders.length ? (
          orders.map((order, index) => (
            <Animated.View key={order.id} entering={FadeInDown.delay(110 + index * 35).duration(230)}>
              <GlassCard style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.status}>{order.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
                <Text style={styles.total}>${order.total.toFixed(2)}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="bag-handle-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.meta}>{order.items.length} item(s)</Text>
                  <Text style={styles.metaSeparator}>|</Text>
                  <Ionicons name="card-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.meta}>{paymentLabel(order.paymentMethod)}</Text>
                </View>
                {order.shipping?.line1 ? (
                  <Text style={styles.shipTo} numberOfLines={3}>
                    Ship to: {order.shipping.name ?? '—'} · {order.shipping.line1}
                    {order.shipping.city ? `, ${order.shipping.city}` : ''}{' '}
                    {order.shipping.postalCode ?? ''}
                  </Text>
                ) : null}
              </GlassCard>
            </Animated.View>
          ))
        ) : (
          <GlassCard style={styles.card}>
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={28} color={colors.olive} />
              <Text style={styles.empty}>No orders yet. Complete checkout to create your first order.</Text>
            </View>
          </GlassCard>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { marginBottom: 14 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, color: colors.textSecondary },
  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  refreshChipText: { color: colors.olive, fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statValue: { marginTop: 2, color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.success + '1A',
  },
  status: { color: colors.success, fontWeight: '700', fontSize: 11 },
  date: { marginTop: 4, color: colors.textSecondary },
  total: { marginTop: 8, color: colors.olive, fontSize: 20, fontWeight: '700' },
  metaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta: { color: colors.textSecondary },
  metaSeparator: { marginHorizontal: 3, color: colors.textSecondary },
  shipTo: { marginTop: 8, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  emptyWrap: { alignItems: 'center', gap: 10 },
  empty: { color: colors.textSecondary, textAlign: 'center' },
});
