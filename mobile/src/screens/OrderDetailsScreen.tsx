import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { getShopOrderById } from '../services/shopApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ShopOrder } from '../types/shop';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function paymentLabel(method: string): string {
  const clean = method.replace(/\uFFFD/g, '').trim();
  if (clean === 'cash-on-delivery') return 'Cash on Delivery';
  if (clean === 'simulated-card') return 'Simulated Card';
  return clean || 'Unknown';
}

export function OrderDetailsScreen({ route }: Props) {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ShopOrder | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getShopOrderById(orderId);
        if (!cancelled) setOrder(data);
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: 'Could not load order',
          text2: (e as Error)?.message,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const statusColor = useMemo(() => {
    const s = (order?.status ?? '').toLowerCase();
    if (s === 'paid') return colors.success;
    if (s === 'pending') return colors.warning;
    return colors.danger;
  }, [order?.status]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.title}>Order #{orderId.slice(0, 8)}</Text>
        <Text style={styles.subtitle}>{order ? `${order.items.length} item(s) · ${formatDate(order.createdAt)}` : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.olive} />
          <Text style={styles.loadingText}>Loading order…</Text>
        </View>
      ) : order ? (
        <>
          <GlassCard style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <Ionicons name="receipt-outline" size={14} color={statusColor} />
                <Text style={[styles.statusText, { color: statusColor }]}>{(order.status ?? '').toUpperCase()}</Text>
              </View>
              <Text style={styles.paymentText}>{paymentLabel(order.paymentMethod)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items?.length ? (
              order.items.map((it) => (
                <View key={it.productId} style={styles.itemTile}>
                  <View style={styles.itemImgWrap}>
                    {it.imageUrl ? (
                      <Image source={{ uri: it.imageUrl }} style={styles.itemImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.itemImgPlaceholder}>
                        <Ionicons name="leaf-outline" size={26} color={colors.textSecondary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {it.productName}
                    </Text>
                    <Text style={styles.itemSub}>
                      Qty {it.quantity} · ${it.unitPrice.toFixed(2)} each
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>${it.lineTotal.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No items in this order.</Text>
            )}
          </GlassCard>

          {order.shipping ? (
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>Shipping</Text>
              <View style={styles.shipBlock}>
                <Text style={styles.shipLine}>{order.shipping.name ?? '—'}</Text>
                {order.shipping.phone ? <Text style={styles.shipLine}>{order.shipping.phone}</Text> : null}
                <Text style={styles.shipLine} numberOfLines={3}>
                  {order.shipping.line1 ?? '—'}
                  {order.shipping.line2 ? `, ${order.shipping.line2}` : ''}
                </Text>
                <Text style={styles.shipLine}>
                  {order.shipping.city ? `${order.shipping.city}, ` : ''}
                  {order.shipping.postalCode ?? ''}
                  {order.shipping.country ? ` · ${order.shipping.country}` : ''}
                </Text>
              </View>
            </GlassCard>
          ) : null}
        </>
      ) : (
        <GlassCard style={styles.card}>
          <Text style={styles.emptyText}>Order not found.</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  subtitle: { color: colors.textSecondary, fontWeight: '600', marginBottom: 12 },
  loadingWrap: { paddingVertical: 28, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.textSecondary, fontWeight: '700' },
  card: { paddingBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.success + '12',
  },
  statusText: { fontWeight: '800', fontSize: 12 },
  paymentText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13, marginTop: 4, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.textSecondary, fontWeight: '700' },
  totalValue: { color: colors.olive, fontWeight: '800', fontSize: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  itemTile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemImgWrap: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden', backgroundColor: '#EEE9E2', borderWidth: 1, borderColor: colors.border },
  itemImg: { width: '100%', height: '100%' },
  itemImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  itemSub: { color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginTop: 3 },
  itemTotal: { color: colors.olive, fontWeight: '800' },
  shipBlock: { gap: 6 },
  shipLine: { color: colors.textSecondary, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, fontWeight: '700', textAlign: 'center', paddingVertical: 24 },
});

