import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, accentGradient } from '../../theme/colors';
import type { ShopProduct } from '../../types/shop';

const shadowCard = Platform.select({
  ios: {
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 5 },
  default: {},
});

function badgeForProduct(product: ShopProduct): string | null {
  if (product.stock <= 0) return null;
  if (product.stock >= 120) return 'Best seller';
  if (product.stock <= 10) return 'Low stock';
  return null;
}

export type ShopProductCardProps = {
  product: ShopProduct;
  /** Shown above the title (e.g. category name), like a brand line */
  categoryLabel: string;
  onProductPress: () => void;
  onAddToCart: () => void;
  addToCartLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Taller default is for full-width lists; use a smaller value in 2-column grids. */
  imageAreaHeight?: number;
};

export function ShopProductCard({
  product,
  categoryLabel,
  onProductPress,
  onAddToCart,
  addToCartLabel = 'Add to cart',
  disabled,
  loading,
  style,
  imageAreaHeight: imageAreaHeightProp,
}: ShopProductCardProps) {
  const { width: winW } = useWindowDimensions();
  const [favorite, setFavorite] = useState(false);
  const badge = useMemo(() => badgeForProduct(product), [product]);
  const formattedPrice = `${product.price.toFixed(2)}${
    product.currency && product.currency !== 'USD' ? ` ${product.currency}` : ''
  }`;

  /** One image fills this full-height frame. */
  const imageFrameHeight =
    imageAreaHeightProp ?? Math.min(280, Math.round(Math.max(winW - 80, 200) * 0.92));

  const out = product.stock <= 0;

  return (
    <View style={[styles.card, shadowCard, style]}>
      <View style={styles.imageSection}>
        <TouchableOpacity activeOpacity={0.92} onPress={onProductPress} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}>
          <View style={[styles.imageWell, { height: imageFrameHeight }]}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.imageFill} resizeMode="cover" />
            ) : (
              <View style={[styles.imageFill, styles.imagePlaceholder]}>
                <Ionicons name="leaf-outline" size={40} color={colors.textSecondary} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {badge ? (
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => setFavorite((f) => !f)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? colors.danger : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.92} onPress={onProductPress} style={styles.textBlock}>
        <Text style={styles.brandLine} numberOfLines={1}>
          {categoryLabel}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.ctaOuter, (out || disabled) && styles.ctaDisabled]}
        onPress={onAddToCart}
        disabled={out || disabled || loading}
        activeOpacity={0.92}
      >
        <LinearGradient
          colors={[...accentGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnOlive} />
          ) : (
            <View style={styles.ctaRow}>
              <Ionicons
                name={out ? 'warning-outline' : 'cart-outline'}
                size={18}
                color={colors.textOnOlive}
              />
              <Text style={styles.ctaStatusText} numberOfLines={1}>
                {out ? 'Unavailable' : 'Add'}
              </Text>
              <Text style={styles.ctaPriceText} numberOfLines={1}>
                ${formattedPrice}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.stockRow} pointerEvents="none">
        <View style={[styles.stockDot, out ? styles.stockDotOut : styles.stockDotIn]} />
        <Text style={[styles.stockText, out ? styles.stockTextOut : styles.stockTextIn]}>
          {out ? 'Out of stock' : 'In stock'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 14,
    marginBottom: 4,
  },
  imageSection: {
    position: 'relative',
    marginBottom: 14,
  },
  imageWell: {
    width: '100%',
    backgroundColor: '#EEE9E2',
    borderRadius: 18,
    overflow: 'hidden',
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E3DC',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    maxWidth: '58%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(119, 126, 73, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(140, 124, 99, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  textBlock: {
    marginBottom: 14,
  },
  brandLine: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.olive,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  ctaOuter: {
    borderRadius: 999,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.olive,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  ctaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaStatusText: { color: colors.textOnOlive, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  ctaPriceText: { color: colors.textOnOlive, fontSize: 14, fontWeight: '800' },
  stockRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  stockDot: { width: 8, height: 8, borderRadius: 99 },
  stockDotIn: { backgroundColor: colors.success },
  stockDotOut: { backgroundColor: colors.danger },
  stockText: { fontSize: 12, fontWeight: '700' },
  stockTextIn: { color: colors.success },
  stockTextOut: { color: colors.danger },
});
