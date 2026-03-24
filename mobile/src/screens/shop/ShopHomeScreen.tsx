import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { colors, accentGradient } from '../../theme/colors';
import { addShopCartItem, getShopCategories, getShopProducts } from '../../services/shopApi';
import type { ShopCategory, ShopProduct } from '../../types/shop';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';

type Props = { navigation: NativeStackNavigationProp<ShopStackParamList, 'ShopHome'> };
type PriceBand = 'all' | 'under10' | '10to20' | 'above20';

const PRICE_OPTIONS: { key: PriceBand; label: string }[] = [
  { key: 'all', label: 'All prices' },
  { key: 'under10', label: '< $10' },
  { key: '10to20', label: '$10 – $20' },
  { key: 'above20', label: '> $20' },
];

function matchesPrice(price: number, band: PriceBand): boolean {
  if (band === 'under10') return price < 10;
  if (band === '10to20') return price >= 10 && price <= 20;
  if (band === 'above20') return price > 20;
  return true;
}

function categoryNameForId(categories: ShopCategory[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? 'Product';
}

export function ShopHomeScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<PriceBand>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const categoryOk = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const priceOk = matchesPrice(p.price, selectedPrice);
      const queryOk = !q || `${p.name} ${p.description ?? ''}`.toLowerCase().includes(q);
      return categoryOk && priceOk && queryOk;
    });
  }, [products, selectedCategory, selectedPrice, query]);

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedPrice !== 'all' || query.trim().length > 0;

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPrice('all');
    setQuery('');
  };

  const addToCart = async (productId: string) => {
    try {
      await addShopCartItem(productId, 1);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add item', text2: (e as Error)?.message });
    }
  };

  const openOrdersTab = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('OrdersHistory' as never);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Hero: gradient banner + search — premium first impression */}
      <Animated.View entering={FadeInDown.duration(280)}>
        <View style={styles.heroOuter}>
          <LinearGradient colors={[...accentGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
            <View style={styles.heroHeaderRow}>
              <View>
                <Text style={styles.heroEyebrow}>Marketplace</Text>
                <Text style={styles.heroTitle}>Agriculture Shop</Text>
              </View>
              <TouchableOpacity style={styles.cartPill} onPress={() => navigation.navigate('Cart')} activeOpacity={0.85}>
                <Ionicons name="cart-outline" size={18} color={colors.textOnOlive} />
                <Text style={styles.cartPillText}>Cart</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroSubtitle}>Curated supplies for healthy crops — treatments, seeds & tools.</Text>

            <View style={styles.searchElevated}>
              <Ionicons name="search" size={20} color={colors.taupe} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or keyword…"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
              />
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Filters in one glass panel for visual grouping */}
      <Animated.View entering={FadeInDown.delay(80).duration(280)}>
        <GlassCard style={styles.filterCard}>
          <View style={styles.filterCardHeader}>
            <Text style={styles.filterCardTitle}>Browse</Text>
            {hasActiveFilters ? (
              <TouchableOpacity onPress={resetFilters} style={styles.resetChip}>
                <Ionicons name="refresh-outline" size={14} color={colors.olive} />
                <Text style={styles.resetChipText}>Reset</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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

          <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Price range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {PRICE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, selectedPrice === opt.key && styles.chipActive]}
                onPress={() => setSelectedPrice(opt.key)}
              >
                <Text style={[styles.chipText, selectedPrice === opt.key && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>
      </Animated.View>

      {/* Results header */}
      <Animated.View entering={FadeInDown.delay(140).duration(280)} style={styles.resultsHead}>
        <View>
          <Text style={styles.resultsTitle}>Products</Text>
          <Text style={styles.resultsSub}>
            {loading ? 'Loading catalog…' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.browseAll} onPress={() => navigation.navigate('Categories')}>
          <Text style={styles.browseAllText}>All categories</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.olive} />
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <View style={styles.skeletonCard}>
            <ActivityIndicator size="large" color={colors.olive} />
            <Text style={styles.skeletonText}>Loading catalog…</Text>
          </View>
        </View>
      ) : null}

      {!loading &&
        filteredProducts.map((product, index) => (
          <Animated.View key={product.id} entering={FadeInDown.delay(180 + index * 40).duration(260)}>
            <GlassCard style={styles.productCard}>
              <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate('ProductDetails', { product })}>
                <View style={styles.productRow}>
                  <View style={styles.imageFrame}>
                    {product.imageUrl ? (
                      <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.productImage, styles.productImageFallback]}>
                        <Ionicons name="leaf-outline" size={28} color={colors.taupe} />
                      </View>
                    )}
                  </View>
                  <View style={styles.productBody}>
                    <View style={styles.pillRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText} numberOfLines={1}>
                          {categoryNameForId(categories, product.categoryId)}
                        </Text>
                      </View>
                      {product.stock > 0 ? (
                        <View style={styles.stockPill}>
                          <View style={styles.stockDot} />
                          <Text style={styles.stockPillText}>In stock</Text>
                        </View>
                      ) : (
                        <View style={[styles.stockPill, styles.stockPillOut]}>
                          <Text style={styles.stockPillTextOut}>Out of stock</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productDesc} numberOfLines={2}>
                      {product.description ?? 'Tap for full details'}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                      <Text style={styles.currency}>{product.currency ?? 'USD'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <View style={styles.cardActions}>
                <GradientButton title="Add to cart" onPress={() => addToCart(product.id)} disabled={product.stock <= 0} />
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => navigation.navigate('ProductDetails', { product })}
                >
                  <Text style={styles.secondaryBtnText}>Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.olive} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        ))}

      {!loading && filteredProducts.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search-outline" size={32} color={colors.olive} />
            </View>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyText}>Adjust your search, category, or price filters to see more products.</Text>
            {hasActiveFilters ? (
              <TouchableOpacity style={styles.emptyCta} onPress={resetFilters}>
                <Text style={styles.emptyCtaText}>Clear all filters</Text>
              </TouchableOpacity>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      <TouchableOpacity style={styles.bottomLink} onPress={openOrdersTab} activeOpacity={0.7}>
        <Ionicons name="receipt-outline" size={18} color={colors.olive} />
        <Text style={styles.bottomLinkText}>Order history</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const shadowCard = Platform.select({
  ios: {
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
  web: { boxShadow: '0 8px 24px rgba(44,44,44,0.08)' },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { paddingBottom: 48 },
  heroOuter: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    ...shadowCard,
  },
  heroGradient: {
    padding: 22,
    paddingBottom: 20,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textOnOlive,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 16,
    maxWidth: '92%',
  },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cartPillText: { color: colors.textOnOlive, fontWeight: '700', fontSize: 14 },
  searchElevated: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
  },
  filterCard: { marginHorizontal: 20, marginBottom: 8 },
  filterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterCardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.olive + '14',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetChipText: { fontSize: 13, fontWeight: '700', color: colors.olive },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterLabelSpaced: { marginTop: 14 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  chipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.textOnOlive },
  resultsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  resultsTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  resultsSub: { marginTop: 2, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  browseAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  browseAllText: { fontSize: 14, fontWeight: '700', color: colors.olive },
  skeletonWrap: { paddingHorizontal: 20, gap: 10 },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    marginBottom: 10,
  },
  skeletonText: { marginTop: 10, color: colors.textSecondary, fontWeight: '600' },
  productCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    overflow: 'hidden',
  },
  productRow: { flexDirection: 'row', gap: 14 },
  imageFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  productImage: { width: 100, height: 100, backgroundColor: colors.cream },
  productImageFallback: { alignItems: 'center', justifyContent: 'center' },
  productBody: { flex: 1, justifyContent: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.olive + '18',
    maxWidth: '70%',
  },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: colors.olive, textTransform: 'uppercase', letterSpacing: 0.3 },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.success + '18',
  },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  stockPillText: { fontSize: 11, fontWeight: '700', color: colors.success },
  stockPillOut: { backgroundColor: colors.danger + '14' },
  stockPillTextOut: { fontSize: 11, fontWeight: '700', color: colors.danger },
  productName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, lineHeight: 22 },
  productDesc: { marginTop: 4, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 },
  price: { fontSize: 20, fontWeight: '800', color: colors.olive },
  currency: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
    marginHorizontal: -4,
  },
  cardActions: { gap: 8 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.olive,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  secondaryBtnText: { color: colors.olive, fontWeight: '700', fontSize: 15 },
  emptyCard: { marginHorizontal: 20, alignItems: 'center', paddingVertical: 28 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.olive + '14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  emptyText: { textAlign: 'center', color: colors.textSecondary, lineHeight: 22, paddingHorizontal: 8, marginBottom: 16 },
  emptyCta: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.olive,
  },
  emptyCtaText: { color: colors.textOnOlive, fontWeight: '700' },
  bottomLink: {
    marginTop: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bottomLinkText: { color: colors.olive, fontWeight: '700', fontSize: 15 },
});
