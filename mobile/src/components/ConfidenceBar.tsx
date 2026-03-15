import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, accentGradient } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface ConfidenceBarProps {
  confidence: number;
  height?: number;
  showLabel?: boolean;
}

export function ConfidenceBar({ confidence, height = 10, showLabel = true }: ConfidenceBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(Math.min(1, Math.max(0, confidence)), {
      damping: 14,
      stiffness: 100,
    });
  }, [confidence]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, { height }, animatedStyle]}>
          <LinearGradient
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      {showLabel && (
        <Text style={styles.label}>✨ {Math.round(confidence * 100)}% confidence</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  track: {
    width: '100%',
    backgroundColor: colors.cream,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: { borderRadius: 999, overflow: 'hidden' },
  label: { marginTop: 8, fontSize: 13, color: colors.textSecondary },
});
