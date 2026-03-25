import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const content = <View style={[styles.inner, style]}>{children}</View>;

  if (Platform.OS === 'web') {
    return <View style={[styles.card, styles.cardWeb, style]}>{content}</View>;
  }

  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    ...Platform.select({
      ios: { shadowColor: colors.taupe, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14 },
      android: { elevation: 6 },
      web: {},
    }),
  },
  cardWeb: {
    backgroundColor: colors.card,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Make the "glass" overlay fully opaque so padding/background matches the content.
    backgroundColor: colors.card,
  },
  inner: {
    padding: 20,
    zIndex: 1,
  },
});
