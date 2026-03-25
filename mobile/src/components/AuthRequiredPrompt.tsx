import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { GradientButton } from './GradientButton';

type Props = {
  title: string;
  subtitle: string;
  onSignIn: () => void;
};

export function AuthRequiredPrompt({ title, subtitle, onSignIn }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="lock-closed-outline" size={48} color={colors.olive} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <GradientButton title="Sign in or create account" onPress={onSignIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
});
