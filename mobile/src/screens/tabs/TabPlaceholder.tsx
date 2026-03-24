import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { colors } from '../../theme/colors';

type Props = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
  ctaLabel: string;
  onCtaPress?: () => void;
};

export function TabPlaceholder({
  title,
  subtitle,
  icon,
  hint,
  ctaLabel,
  onCtaPress,
}: Props) {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={28} color={colors.olive} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.hint}>{hint}</Text>
        <GradientButton title={ctaLabel} onPress={onCtaPress ?? (() => {})} />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.cream },
  card: { marginTop: 10 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive + '18',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 14 },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
