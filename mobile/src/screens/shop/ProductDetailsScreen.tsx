import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { addShopCartItem } from '../../services/shopApi';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';

type Props = { route: RouteProp<ShopStackParamList, 'ProductDetails'> };

export function ProductDetailsScreen({ route }: Props) {
  const { product } = route.params;

  const addToCart = async () => {
    try {
      await addShopCartItem(product.id, 1);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add item', text2: (e as Error)?.message });
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GlassCard>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" /> : null}
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Text style={styles.desc}>{product.description ?? 'No description available.'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Stock: {product.stock}</Text>
          <Text style={styles.meta}>Category: {product.categoryId}</Text>
        </View>
        <GradientButton title="Add to cart" onPress={addToCart} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  image: { width: '100%', height: 200, borderRadius: 14, marginBottom: 14 },
  name: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  price: { color: colors.olive, fontSize: 20, fontWeight: '700', marginBottom: 10 },
  desc: { color: colors.textSecondary, lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  meta: { color: colors.textSecondary },
});
