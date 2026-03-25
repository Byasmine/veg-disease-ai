import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import type { ShopStackParamList } from '../../navigation/MainTabNavigator';
import { GradientButton } from '../../components/GradientButton';

type Props = NativeStackScreenProps<ShopStackParamList, 'OrderPaid'>;

export function OrderPaidScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
          </View>
          <Text style={styles.title}>Order paid successfully</Text>
        </View>

        <Text style={styles.orderNumber}>Order #{orderId.slice(0, 8)}</Text>

        <Text style={styles.subtitle}>Thanks for your purchase. You can continue shopping anytime.</Text>

        <GradientButton title="Continue shopping" onPress={() => navigation.navigate('ShopHome')} />
      </GlassCard>

      <TouchableOpacity onPress={() => navigation.navigate('ShopHome')} style={styles.secondaryLink} activeOpacity={0.8}>
        <Text style={styles.secondaryLinkText}>Back to shop</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  card: { paddingBottom: 8 },
  header: { alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.success + '12', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  orderNumber: { marginTop: 6, fontSize: 14, fontWeight: '800', color: colors.textSecondary, textAlign: 'center' },
  subtitle: { marginTop: 12, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  secondaryLink: { marginTop: 14, alignSelf: 'center' },
  secondaryLinkText: { color: colors.olive, fontWeight: '800' },
});

