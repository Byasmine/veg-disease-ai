import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShopProductCard } from '../components/shop/ShopProductCard';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ShopCategory, ShopProduct } from '../types/shop';
import { addShopCartItem, getShopCategories, getShopProducts } from '../services/shopApi';
import { useAuth } from '../context/AuthContext';
import { goToAuth } from '../navigation/navigationRef';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Shop'> };

function categoryNameForId(categories: ShopCategory[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? 'Shop';
}

export function ShopScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([getShopCategories(), getShopProducts()]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Shop unavailable', text2: (e as Error)?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const addToCart = async (productId: string) => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Sign in required', text2: 'Sign in to add items to your cart.' });
      goToAuth(navigation);
      return;
    }
    setAddingId(productId);
    try {
      await addShopCartItem(productId, 1);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add item', text2: (e as Error)?.message });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeInDown.duration(250)}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Agriculture Shop</Text>
          <Text style={styles.subtitle}>Buy treatment products, seeds, fertilizers and tools.</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={18} color={colors.olive} />
              <Text style={styles.quickBtnText}>Open Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Orders')}>
              <Ionicons name="receipt-outline" size={18} color={colors.olive} />
              <Text style={styles.quickBtnText}>Order History</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(250)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
          <TouchableOpacity
            style={[styles.chip, selectedCategory === 'all' && styles.chipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.chipText, selectedCategory === 'all' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(250)}>
        {visibleProducts.map((product) => (
          <ShopProductCard
            key={product.id}
            product={product}
            categoryLabel={categoryNameForId(categories, product.categoryId)}
            onProductPress={() =>
              navigation.navigate(
                'MainTabs',
                {
                  screen: 'Shop',
                  params: { screen: 'ProductDetails', params: { product } },
                } as never
              )
            }
            onAddToCart={() => addToCart(product.id)}
            loading={addingId === product.id}
            style={styles.productCard}
          />
        ))}
      </Animated.View>

      {!loading && visibleProducts.length === 0 ? (
        <Text style={styles.empty}>No products in this category yet.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.textSecondary },
  quickActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
  },
  quickBtnText: { color: colors.olive, fontWeight: '600' },
  chipsWrap: { paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipText: { color: colors.textPrimary, fontWeight: '600' },
  chipTextActive: { color: colors.textOnOlive },
  productCard: { marginBottom: 14 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 20 },
});
