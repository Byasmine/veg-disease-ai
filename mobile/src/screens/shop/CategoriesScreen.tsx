import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '../../components/GlassCard';
import { colors } from '../../theme/colors';
import { getShopCategories } from '../../services/shopApi';
import type { ShopCategory } from '../../types/shop';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';

type Props = { navigation: NativeStackNavigationProp<ShopStackParamList, 'Categories'> };

export function CategoriesScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);

  useEffect(() => {
    getShopCategories().then(setCategories).catch((e) => {
      Toast.show({ type: 'error', text1: 'Could not load categories', text2: (e as Error)?.message });
    });
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {categories.map((cat) => (
        <GlassCard key={cat.id} style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ProductList', { categoryId: cat.id, categoryName: cat.name })}
          >
            <View style={styles.left}>
              <Ionicons name="leaf-outline" size={18} color={colors.olive} />
              <Text style={styles.name}>{cat.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {!!cat.description && <Text style={styles.desc}>{cat.description}</Text>}
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  desc: { marginTop: 8, color: colors.textSecondary, lineHeight: 20 },
});
