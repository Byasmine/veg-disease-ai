import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { colors, accentGradient } from '../../theme/colors';
import { addShopCartItem, getShopProducts } from '../../services/shopApi';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';
import type { ShopProduct } from '../../types/shop';
import { useAuth } from '../../context/AuthContext';
import { goToAuth } from '../../navigation/navigationRef';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DESC_PREVIEW_LEN = 140;

type Props = { route: RouteProp<ShopStackParamList, 'ProductDetails'> };
type Nav = NativeStackNavigationProp<ShopStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ route }: Props) {
  const { product } = route.params;
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { user } = useAuth();

  /** Single image fills this full-height frame (edge-to-edge width). */
  const galleryFrameHeight = Math.round(Math.min(winH * 0.46, 440));

  const [quantity, setQuantity] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [related, setRelated] = useState<ShopProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    setQuantity(1);
    setDescExpanded(false);
  }, [product.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRelatedLoading(true);
      try {
        const list = await getShopProducts({ categoryId: product.categoryId });
        if (cancelled) return;
        const others = list.filter((p) => p.id !== product.id).slice(0, 8);
        setRelated(others);
      } catch {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.categoryId, product.id]);

  const description = product.description?.trim() || 'No description available for this item yet.';
  const longDesc = description.length > DESC_PREVIEW_LEN;
  const descShown =
    descExpanded || !longDesc ? description : `${description.slice(0, DESC_PREVIEW_LEN).trim()}…`;

  const stockLabel = useMemo(() => {
    if (product.stock <= 0) return { text: 'Out of stock', ok: false };
    if (product.stock <= 8) return { text: `Only ${product.stock} left — order soon`, ok: true };
    return { text: 'Available in stock', ok: true };
  }, [product.stock]);

  const maxQty = Math.max(0, Math.min(product.stock, 99));

  const bumpQty = useCallback(
    (delta: number) => {
      setQuantity((q) => {
        const n = q + delta;
        return Math.min(maxQty, Math.max(1, n));
      });
    },
    [maxQty]
  );

  const toggleDesc = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescExpanded((e) => !e);
  };

  const addToCart = async () => {
    if (product.stock <= 0) return;
    if (!user) {
      Toast.show({ type: 'info', text1: 'Sign in required', text2: 'Sign in to add items to your cart.' });
      goToAuth(navigation);
      return;
    }
    setAdding(true);
    try {
      await addShopCartItem(product.id, quantity);
      Toast.show({ type: 'success', text1: 'Added to cart', text2: `${quantity} × ${product.name}` });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add item', text2: (e as Error)?.message });
    } finally {
      setAdding(false);
    }
  };

  const openProduct = (p: ShopProduct) => {
    navigation.push('ProductDetails', { product: p });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* —— Single product image (full bleed, fills frame height) —— */}
        <View style={styles.galleryBlock}>
          <View style={[styles.heroFrame, { width: winW, height: galleryFrameHeight }]}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.heroImageFill} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImageFill, styles.heroPlaceholder]}>
                <Ionicons name="image-outline" size={56} color={colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={[styles.topBarOverlay, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            {/* <Text style={styles.topTitle} numberOfLines={1}>
              Product details
            </Text> */}
            <View style={styles.iconCircleMuted} />
          </View>
        </View>

        {/* —— Info card (overlaps gallery) —— */}
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
          <View style={styles.cardGrab} />

          <View style={styles.titleRow}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.price}>
              ${product.price.toFixed(2)}
              <Text style={styles.priceUnit}> / ea</Text>
            </Text>
          </View>

          <Text style={[styles.stockText, !stockLabel.ok && styles.stockOut]}>{stockLabel.text}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingLeft}>
              <Ionicons name="star" size={16} color={colors.olive} />
              <Text style={styles.ratingText}>Grower favorite</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                onPress={() => bumpQty(-1)}
                disabled={quantity <= 1 || product.stock <= 0}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={18} color={colors.textOnOlive} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity >= maxQty && styles.qtyBtnDisabled]}
                onPress={() => bumpQty(1)}
                disabled={quantity >= maxQty || product.stock <= 0}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={18} color={colors.textOnOlive} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.descBody}>{descShown}</Text>
            {longDesc ? (
              <TouchableOpacity onPress={toggleDesc} hitSlop={8}>
                <Text style={styles.readMore}>{descExpanded ? 'Show less' : 'Read more'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You may also like</Text>
            {relatedLoading ? (
              <ActivityIndicator color={colors.olive} style={styles.relatedSpinner} />
            ) : related.length === 0 ? (
              <Text style={styles.relatedEmpty}>More items in this category coming soon.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
                {related.slice(0, 6).map((p) => (
                  <TouchableOpacity key={p.id} style={styles.relatedTile} onPress={() => openProduct(p)} activeOpacity={0.85}>
                    {p.imageUrl ? (
                      <Image source={{ uri: p.imageUrl }} style={styles.relatedImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.relatedImg, styles.relatedImgPh]}>
                        <Ionicons name="leaf-outline" size={22} color={colors.olive} />
                      </View>
                    )}
                    <Text style={styles.relatedName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.relatedPrice}>${p.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity
            style={[styles.ctaOuter, (product.stock <= 0 || adding) && styles.ctaDisabled]}
            onPress={addToCart}
            disabled={product.stock <= 0 || adding}
            activeOpacity={0.92}
          >
            <LinearGradient colors={[...accentGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
              {adding ? (
                <ActivityIndicator color={colors.textOnOlive} />
              ) : (
                <>
                  <View style={styles.ctaIconCircle}>
                    <Ionicons name="add" size={22} color={colors.olive} />
                  </View>
                  <Text style={styles.ctaText}>Add to cart</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  galleryBlock: {
    backgroundColor: '#E8E2D6',
    position: 'relative',
    paddingBottom: 12,
  },
  heroFrame: {
    alignSelf: 'center',
    backgroundColor: '#E8E3DC',
    overflow: 'hidden',
  },
  heroImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topBarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircleMuted: {
    width: 42,
    height: 42,
    borderRadius: 21,
    opacity: 0,
  },
  pressed: { opacity: 0.85 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 8,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: -20,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGrab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(140, 124, 99, 0.25)',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  productName: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.olive,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stockText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  stockOut: {
    color: colors.danger,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.olive,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  section: {
    marginTop: 22,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  descBody: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  readMore: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: colors.olive,
  },
  relatedSpinner: { marginVertical: 20 },
  relatedEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  relatedRow: {
    paddingRight: 8,
    gap: 12,
    flexDirection: 'row',
  },
  relatedTile: {
    width: 112,
  },
  relatedImg: {
    width: 112,
    height: 112,
    borderRadius: 16,
    backgroundColor: '#F0EBE3',
    marginBottom: 8,
  },
  relatedImgPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 16,
    marginBottom: 4,
  },
  relatedPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.olive,
  },
  ctaOuter: {
    marginTop: 28,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: colors.olive,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  ctaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textOnOlive,
    letterSpacing: 0.3,
  },
});
