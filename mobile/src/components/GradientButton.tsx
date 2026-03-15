import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { accentGradient, colors } from '../theme/colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  emoji?: string;
  icon?: React.ReactNode;
}

export function GradientButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  emoji,
  icon,
}: GradientButtonProps) {
  const displayTitle = emoji ? `${emoji} ${title}` : title;
  const textStyle = variant === 'outline' ? styles.outlineText : styles.text;

  const content = loading ? (
    variant === 'outline' ? (
      <ActivityIndicator color={colors.olive} />
    ) : (
      <ActivityIndicator color="#fff" />
    )
  ) : (
    <View style={styles.labelRow}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={textStyle}>{displayTitle}</Text>
    </View>
  );

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.outline]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={styles.touchable}
    >
      <LinearGradient
        colors={accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: { borderRadius: 16, overflow: 'hidden' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { justifyContent: 'center' },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonDisabled: { opacity: 0.6 },
  text: { color: colors.textOnOlive, fontSize: 17, fontWeight: '600' },
  outline: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.olive,
    alignItems: 'center',
    minHeight: 56,
    marginTop: 12,
  },
  outlineText: { color: colors.olive, fontSize: 17, fontWeight: '600' },
});
