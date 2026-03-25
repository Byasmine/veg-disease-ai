import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { GradientButton } from '../components/GradientButton';
import type { ShopCart } from '../types/shop';
import { clearShopCart, getShopCart, removeShopCartItem, updateShopCartItem } from '../services/shopApi';
import { useAuth } from '../context/AuthContext';
import { AuthRequiredPrompt } from '../components/AuthRequiredPrompt';
import { goToAuth } from '../navigation/navigationRef';
import { showErrorToast } from '../utils/showApiError';

type Props = { navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'Cart'> };

export function CartScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShopCart();
      setCart(data);
    } catch (e) {
      showErrorToast(e, { title: 'Cart unavailable', fallback: 'Could not load cart.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadCart();
    else setCart(null);
  }, [user, loadCart]);

  if (!user) {
    return (
      <AuthRequiredPrompt
        title="Sign in to use the cart"
        subtitle="Save items and checkout after you create an account."
        onSignIn={() => goToAuth(navigation)}
      />
    );
  }

  const updateQty = async (itemId: string, quantity: number) => {
    try {
      const data = await updateShopCartItem(itemId, quantity);
      setCart(data);
    } catch (e) {
      showErrorToast(e, { title: 'Could not update cart', fallback: 'Update failed.' });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const data = await removeShopCartItem(itemId);
      setCart(data);
    } catch (e) {
      showErrorToast(e, { title: 'Could not remove item', fallback: 'Remove failed.' });
    }
  };

  const clearCart = async () => {
    try {
      const data = await clearShopCart();
      setCart(data);
      Toast.show({ type: 'success', text1: 'Cart cleared' });
    } catch (e) {
      showErrorToast(e, { title: 'Could not clear cart', fallback: 'Clear failed.' });
    }
  };

  const items = cart?.items ?? [];

  return (
    <View style={styles.scroll}>
      <StatusBar style="dark" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(250)}>
            <GlassCard style={styles.card}>
              <Text style={styles.title}>Your Cart</Text>
              <Text style={styles.subtitle}>{loading ? 'Loading…' : `${items.length} item(s)`}</Text>
            </GlassCard>
          </Animated.View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState message="Loading cart…" />
          ) : (
            <Animated.View entering={FadeInDown.delay(80).duration(250)}>
              <EmptyState
                title="Your cart is empty"
                subtitle="Add products from the shop to get started."
                icon={<Ionicons name="bag-outline" size={42} color={colors.olive} />}
                style={{ padding: 24 }}
              />
            </Animated.View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(60 + index * 30).duration(220)}>
            <GlassCard style={styles.itemCard}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemSub}>${item.unitPrice.toFixed(2)} each</Text>
              <View style={styles.row}>
                <View style={styles.qtyWrap}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
                    onPress={() => updateQty(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    activeOpacity={0.7}
                    accessibilityLabel="Decrease quantity"
                  >
                    <Ionicons name="remove" size={18} color={colors.olive} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText} accessibilityLabel={`Quantity: ${item.quantity}`}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.qtyBtn,
                      (item.product.stock <= 0 || item.quantity >= item.product.stock) && styles.qtyBtnDisabled,
                    ]}
                    onPress={() => updateQty(item.id, item.quantity + 1)}
                    disabled={item.product.stock <= 0 || item.quantity >= item.product.stock}
                    activeOpacity={0.7}
                    accessibilityLabel="Increase quantity"
                  >
                    <Ionicons name="add" size={18} color={colors.olive} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lineTotal}>${item.lineTotal.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeItem(item.id)}
                style={styles.removeBtn}
                accessibilityLabel={`Remove ${item.product.name} from cart`}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}
        ListFooterComponent={
          <Animated.View entering={FadeInDown.delay(120).duration(250)}>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryTotal}>${(cart?.total ?? 0).toFixed(2)}</Text>
              </View>
              <GradientButton title="Proceed to checkout" onPress={() => navigation.navigate('Checkout')} disabled={!items.length} />
              <GradientButton title="Clear cart" variant="outline" onPress={clearCart} disabled={!items.length} />
            </GlassCard>
          </Animated.View>
        }
      />
    </View>
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
  qtyBtnDisabled: { opacity: 0.35 },
  qtyText: { width: 20, textAlign: 'center', fontWeight: '700', color: colors.textPrimary },
  lineTotal: { fontSize: 16, fontWeight: '700', color: colors.olive },
  removeBtn: { marginTop: 10, alignSelf: 'flex-start' },
  removeText: { color: colors.danger, fontWeight: '600' },
  summaryCard: { marginTop: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: colors.textPrimary },
  summaryTotal: { fontSize: 20, fontWeight: '700', color: colors.olive },
});
