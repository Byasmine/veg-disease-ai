import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { addShopCartItem, getShopProducts } from '../../services/shopApi';
import type { ShopProduct } from '../../types/shop';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ShopStackParamList, 'ProductList'>;
  route: RouteProp<ShopStackParamList, 'ProductList'>;
};

export function ProductListScreen({ navigation, route }: Props) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const categoryId = route.params?.categoryId;
  const categoryName = route.params?.categoryName;

  const load = useCallback(async () => {
    try {
      const data = await getShopProducts(categoryId ? { categoryId } : undefined);
      setProducts(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not load products', text2: (e as Error)?.message });
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const addToCart = async (productId: string) => {
    try {
      await addShopCartItem(productId, 1);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not add item', text2: (e as Error)?.message });
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {categoryName ? <Text style={styles.categoryTitle}>{categoryName}</Text> : null}
      {products.map((product) => (
        <GlassCard key={product.id} style={styles.card}>
          <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { product })}>
            <View style={styles.row}>
              {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.img} /> : <View style={styles.img} />}
              <View style={styles.body}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{product.description ?? 'No description'}</Text>
                <Text style={styles.price}>${product.price.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <GradientButton title="Add to cart" onPress={() => addToCart(product.id)} />
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  categoryTitle: { marginBottom: 10, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  img: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.cardMuted },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  desc: { marginTop: 4, color: colors.textSecondary },
  price: { marginTop: 8, color: colors.olive, fontWeight: '700', fontSize: 16 },
});
