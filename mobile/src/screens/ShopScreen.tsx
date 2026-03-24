import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ShopCategory, ShopProduct } from '../types/shop';
import { addShopCartItem, getShopCategories, getShopProducts } from '../services/shopApi';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Shop'> };

export function ShopScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

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
    try {
      await addShopCartItem(productId, 1);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add item', text2: (e as Error)?.message });
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
          <GlassCard key={product.id} style={styles.productCard}>
            <View style={styles.productRow}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, styles.productImageFallback]}>
                  <Ionicons name="leaf-outline" size={20} color={colors.taupe} />
                </View>
              )}
              <View style={styles.productBody}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc}>{product.description ?? 'No description'}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                  <Text style={styles.stock}>Stock: {product.stock}</Text>
                </View>
              </View>
            </View>
            <GradientButton title="Add to cart" onPress={() => addToCart(product.id)} />
          </GlassCard>
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
  productRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  productImage: { width: 76, height: 76, borderRadius: 10, backgroundColor: colors.cream },
  productImageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  productBody: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  productDesc: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  metaRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '700', color: colors.olive },
  stock: { fontSize: 13, color: colors.textSecondary },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 20 },
});
