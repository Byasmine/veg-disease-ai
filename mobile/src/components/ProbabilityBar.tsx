import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface ProbabilityBarProps {
  label: string;
  confidence: number;
  maxConfidence?: number;
  delay?: number;
}

export function ProbabilityBar({ label, confidence, maxConfidence = 1, delay = 0 }: ProbabilityBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    const target = maxConfidence > 0 ? Math.min(1, confidence / maxConfidence) : 0;
    const timer = delay ? setTimeout(() => { width.value = withSpring(target, { damping: 14, stiffness: 90 }); }, delay) : null;
    if (!delay) width.value = withSpring(target, { damping: 14, stiffness: 90 });
    return () => { if (timer) clearTimeout(timer); };
  }, [confidence, maxConfidence, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const pct = Math.round(confidence * 100);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.barRow}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, animatedStyle]} />
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cream,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.olive,
    borderRadius: 4,
  },
  pct: { fontSize: 14, fontWeight: '600', color: colors.olive, minWidth: 36, textAlign: 'right' },
});
