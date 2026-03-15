import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface AnimatedLoaderProps {
  message: string;
  emoji?: string;
  icon?: React.ReactNode;
}

export function AnimatedLoader({ message, emoji = '🌿', icon }: AnimatedLoaderProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.7, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.box}>
      {icon ? (
        <Animated.View style={[styles.iconWrap, animatedStyle]}>{icon}</Animated.View>
      ) : (
        <Animated.Text style={[styles.emoji, animatedStyle]}>{emoji}</Animated.Text>
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginBottom: 20 },
  emoji: { fontSize: 64, marginBottom: 20 },
  message: { fontSize: 17, color: colors.textPrimary, textAlign: 'center', maxWidth: 260 },
});
