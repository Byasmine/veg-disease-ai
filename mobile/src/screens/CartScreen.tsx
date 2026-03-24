import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ShopCart } from '../types/shop';
import { clearShopCart, getShopCart, removeShopCartItem, updateShopCartItem } from '../services/shopApi';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Cart'> };

export function CartScreen({ navigation }: Props) {
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShopCart();
      setCart(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Cart unavailable', text2: (e as Error)?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const updateQty = async (itemId: string, quantity: number) => {
    try {
      const data = await updateShopCartItem(itemId, quantity);
      setCart(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not update cart', text2: (e as Error)?.message });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const data = await removeShopCartItem(itemId);
      setCart(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not remove item', text2: (e as Error)?.message });
    }
  };

  const clearCart = async () => {
    try {
      const data = await clearShopCart();
      setCart(data);
      Toast.show({ type: 'success', text1: 'Cart cleared' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not clear cart', text2: (e as Error)?.message });
    }
  };

  const items = cart?.items ?? [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(250)}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Your Cart</Text>
          <Text style={styles.subtitle}>{loading ? 'Loading...' : `${items.length} item(s)`}</Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(250)}>
        {items.map((item) => (
          <GlassCard key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemSub}>${item.unitPrice.toFixed(2)} each</Text>
            <View style={styles.row}>
              <View style={styles.qtyWrap}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity - 1)}>
                  <Ionicons name="remove" size={18} color={colors.olive} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity + 1)}>
                  <Ionicons name="add" size={18} color={colors.olive} />
                </TouchableOpacity>
              </View>
              <Text style={styles.lineTotal}>${item.lineTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(250)}>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryTotal}>${(cart?.total ?? 0).toFixed(2)}</Text>
          </View>
          <GradientButton
            title="Proceed to checkout"
            onPress={() => navigation.navigate('Checkout')}
            disabled={!items.length}
          />
          <GradientButton title="Clear cart" variant="outline" onPress={clearCart} disabled={!items.length} />
        </GlassCard>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, color: colors.textSecondary },
  itemCard: { marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  itemSub: { color: colors.textSecondary, marginTop: 4 },
  row: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  qtyText: { width: 20, textAlign: 'center', fontWeight: '700', color: colors.textPrimary },
  lineTotal: { fontSize: 16, fontWeight: '700', color: colors.olive },
  removeBtn: { marginTop: 10, alignSelf: 'flex-start' },
  removeText: { color: colors.danger, fontWeight: '600' },
  summaryCard: { marginTop: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: colors.textPrimary },
  summaryTotal: { fontSize: 20, fontWeight: '700', color: colors.olive },
});
