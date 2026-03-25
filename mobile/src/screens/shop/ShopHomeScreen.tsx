import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { GlassCard } from '../../components/GlassCard';
import { ShopProductCard } from '../../components/shop/ShopProductCard';
import { colors } from '../../theme/colors';
import { addShopCartItem, getShopCategories, getShopProducts } from '../../services/shopApi';
import type { ShopCategory, ShopProduct } from '../../types/shop';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';
import { useAuth } from '../../context/AuthContext';
import { goToAuth } from '../../navigation/navigationRef';

type Props = { navigation: NativeStackNavigationProp<ShopStackParamList, 'ShopHome'> };
type PriceBand = 'all' | 'under10' | '10to20' | 'above20';

const PRICE_OPTIONS: { key: PriceBand; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'under10', label: '< $10' },
  { key: '10to20', label: '$10–20' },
  { key: 'above20', label: '> $20' },
];

const H_PAD = 20;

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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<PriceBand>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

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

  const openOrdersTab = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('OrdersHistory' as never);
    }
  };

  const topPad = Math.max(insets.top, 12);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* —— Minimal header strip (no copy); sage tint separates from main cream —— */}
        <View style={[styles.headerStrip, { paddingTop: topPad }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerBrand}>
              <View style={styles.shopLogoCircle} accessibilityRole="image" accessibilityLabel="Leaf Doctor">
                <Ionicons name="leaf" size={28} color={colors.olive} />
              </View>
              <Text style={styles.byAgilicis}>Leaf Doctor</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Categories')}
                accessibilityLabel="Browse categories"
                activeOpacity={0.85}
              >
                <Ionicons name="grid-outline" size={22} color={colors.olive} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Cart')}
                accessibilityLabel="Open cart"
                activeOpacity={0.85}
              >
                <Ionicons name="bag-outline" size={22} color={colors.olive} />
              </TouchableOpacity>
            </View>
          </View>
          
        {/* —— Search —— */}
        <Animated.View entering={FadeInDown.duration(240)} style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.olive} style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products…"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
        </View>


        {/* —— Filters: single card, clear hierarchy —— */}
        <Animated.View entering={FadeInDown.delay(40).duration(240)} style={styles.filterSection}>
          <View style={styles.filterPanel}>
            <View style={styles.filterPanelHead}>
              <Text style={styles.filterPanelTitle}>Refine</Text>
              {hasActiveFilters ? (
                <TouchableOpacity onPress={resetFilters} style={styles.resetTextBtn} hitSlop={8}>
                  <Text style={styles.resetTextBtnLabel}>Clear all</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.filterGroupLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              <TouchableOpacity
                style={[styles.chip, selectedCategory === 'all' && styles.chipOn]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[styles.chipLabel, selectedCategory === 'all' && styles.chipLabelOn]}>All</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selectedCategory === cat.id && styles.chipOn]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.chipLabel, selectedCategory === cat.id && styles.chipLabelOn]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.filterGroupLabel, styles.filterGroupLabelSpaced]}>Price</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {PRICE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, selectedPrice === opt.key && styles.chipOn]}
                  onPress={() => setSelectedPrice(opt.key)}
                >
                  <Text style={[styles.chipLabel, selectedPrice === opt.key && styles.chipLabelOn]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* —— Store catalog (single column) —— */}
        <View style={styles.catalogHead}>
          <View>
            <Text style={styles.catalogTitle}>Agriculture products</Text>
            <Text style={styles.catalogMeta}>
              {loading
                ? 'Loading…'
                : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'} · Leaf Doctor store`}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.olive} />
            <Text style={styles.loadingText}>Loading catalog…</Text>
          </View>
        ) : null}

        {!loading &&
          filteredProducts.map((product, index) => (
            <Animated.View
              key={product.id}
              entering={FadeInDown.delay(Math.min(index * 40, 420)).duration(240)}
              style={styles.productCardWrap}
            >
              <ShopProductCard
                product={product}
                categoryLabel={categoryNameForId(categories, product.categoryId)}
                onProductPress={() => navigation.navigate('ProductDetails', { product })}
                onAddToCart={() => addToCart(product.id)}
                loading={addingId === product.id}
              />
            </Animated.View>
          ))}

        {!loading && filteredProducts.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(280)} style={styles.emptyWrap}>
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="search-outline" size={28} color={colors.olive} />
              </View>
              <Text style={styles.emptyTitle}>Nothing matches</Text>
              <Text style={styles.emptyText}>Try another search or clear filters to see everything in the store.</Text>
              {hasActiveFilters ? (
                <TouchableOpacity style={styles.emptyCta} onPress={resetFilters} activeOpacity={0.9}>
                  <Text style={styles.emptyCtaText}>Clear filters</Text>
                </TouchableOpacity>
              ) : null}
            </GlassCard>
          </Animated.View>
        ) : null}

        <TouchableOpacity style={styles.footerLink} onPress={openOrdersTab} activeOpacity={0.75}>
          <Ionicons name="receipt-outline" size={18} color={colors.olive} />
          <Text style={styles.footerLinkText}>Order history</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  /** Lighter sage than main `cream` body so the bar reads as its own band. */
  headerStrip: {
    backgroundColor: colors.olive,
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  /** Same mark as HomeHub — leaf in olive roundel. */
  shopLogoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  byAgilicis: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.creamMuted,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.creamMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  searchSection: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 4,
    minHeight: 50,
  },
  searchIcon: { marginRight: 4 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
  },
  filterSection: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterPanel: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  filterPanelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resetTextBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  resetTextBtnLabel: { fontSize: 14, fontWeight: '700', color: colors.olive },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterGroupLabelSpaced: { marginTop: 14 },
  chipScroll: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, paddingBottom: 2 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipLabelOn: { color: colors.textOnOlive },
  catalogHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginTop: 20,
    marginBottom: 12,
  },
  catalogTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  catalogMeta: { marginTop: 2, fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  productCardWrap: { marginHorizontal: H_PAD, marginBottom: 14 },
  loadingBox: {
    marginHorizontal: H_PAD,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  emptyWrap: { paddingHorizontal: H_PAD, marginTop: 8 },
  emptyCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.olive + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptyText: { textAlign: 'center', color: colors.textSecondary, lineHeight: 21, marginBottom: 16 },
  emptyCta: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.olive,
  },
  emptyCtaText: { color: colors.textOnOlive, fontWeight: '700', fontSize: 15 },
  footerLink: {
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerLinkText: { color: colors.olive, fontWeight: '700', fontSize: 15 },
});
