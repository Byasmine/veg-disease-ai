import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '../../components/GlassCard';
import { colors } from '../../theme/colors';
import { getShopCategories } from '../../services/shopApi';
import type { ShopCategory } from '../../types/shop';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';
import { showErrorToast } from '../../utils/showApiError';

type Props = { navigation: NativeStackNavigationProp<ShopStackParamList, 'Categories'> };

export function CategoriesScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);

  const categoryIconById = useMemo<Partial<Record<string, keyof typeof Ionicons.glyphMap>>>(() => {
    return {
      'cat-fertilizers': 'bulb-outline',
      'cat-pesticides': 'bug-outline',
      'cat-seeds': 'leaf-outline',
      'cat-tools': 'medkit-outline',
    };
  }, []);

  useEffect(() => {
    getShopCategories().then(setCategories).catch((e) => {
      showErrorToast(e, { title: 'Could not load categories', fallback: 'Please try again.' });
    });
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subTitle}>
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </Text>
      </View>
      {categories.map((cat) => (
        <GlassCard key={cat.id} style={styles.card}>
          <TouchableOpacity
            style={styles.cardPress}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ProductList', { categoryId: cat.id, categoryName: cat.name })}
          >
            <View style={styles.topRow}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={(categoryIconById[cat.id] ?? 'leaf-outline') as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={colors.textOnOlive}
                />
              </View>

              <View style={styles.titleWrap}>
                <Text style={styles.name}>{cat.name}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>

            <Text style={styles.desc} numberOfLines={3}>
              {cat.description ?? ''}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  subTitle: { marginTop: 4, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  card: { marginBottom: 12 },
  cardPress: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive + '1A',
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleWrap: { flex: 1, marginLeft: 10, paddingRight: 10 },
  name: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  desc: { marginTop: 10, color: colors.textSecondary, lineHeight: 20, flexShrink: 1 },
});
