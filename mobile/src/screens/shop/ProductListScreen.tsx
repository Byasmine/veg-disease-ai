import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { colors } from '../../theme/colors';
import { ShopProductCard } from '../../components/shop/ShopProductCard';
import { addShopCartItem, getShopProducts } from '../../services/shopApi';
import type { ShopProduct } from '../../types/shop';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';
import { useAuth } from '../../context/AuthContext';
import { goToAuth } from '../../navigation/navigationRef';
import { showErrorToast } from '../../utils/showApiError';

type Props = {
  navigation: NativeStackNavigationProp<ShopStackParamList, 'ProductList'>;
  route: RouteProp<ShopStackParamList, 'ProductList'>;
};

export function ProductListScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const categoryId = route.params?.categoryId;
  const categoryName = route.params?.categoryName ?? 'All products';

  const load = useCallback(async () => {
    try {
      const data = await getShopProducts(categoryId ? { categoryId } : undefined);
      setProducts(data);
    } catch (e) {
      showErrorToast(e, { title: 'Could not load products', fallback: 'Please try again.' });
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

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
      showErrorToast(e, { title: 'Could not add item', fallback: 'Please try again.' });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.content}
      data={products}
      keyExtractor={(p) => p.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySub}>
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      }
      renderItem={({ item: product }) => (
        <ShopProductCard
          product={product}
          categoryLabel={categoryName}
          onProductPress={() => navigation.navigate('ProductDetails', { product })}
          onAddToCart={() => addToCart(product.id)}
          loading={addingId === product.id}
          style={styles.cardSpacing}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No products in this list yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  categoryTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  categorySub: { marginTop: 4, marginBottom: 16, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  cardSpacing: { marginBottom: 12 },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
});
