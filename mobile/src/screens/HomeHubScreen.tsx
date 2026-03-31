import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function MenuButton({
  icon,
  label,
  onPress,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      entering={FadeInDown.delay(delay).springify().damping(14)}
      style={[styles.menuBtn, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      activeOpacity={1}
    >
      <View style={styles.menuBtnInner}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={22} color={colors.olive} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </AnimatedTouchable>
  );
}

export function HomeHubScreen() {
  const navigation = useNavigation();
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 14 });
    pulse.value = withDelay(
      800,
      withRepeat(
        withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })),
        -1,
        true
      )
    );
  }, [logoOpacity, logoScale, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    opacity: 0.14 + pulse.value * 0.12,
  }));
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * (1 + pulse.value * 0.05) }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.olive, '#5E6539', '#4a5228']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.pulseOrb, pulseStyle]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)} style={[styles.logoWrap, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={56} color={colors.textOnOlive} />
          </View>
          <Text style={styles.title}>LEAF DOCTOR</Text>
          <Text style={styles.subtitle}>by Agilicis</Text>
        </Animated.View>

        <View style={styles.menu}>
          <MenuButton
            icon="help-circle-outline"
            label="Info"
            onPress={() => (navigation as any).getParent()?.navigate('Help')}
            delay={160}
          />
          <MenuButton
            icon="information-circle-outline"
            label="About"
            onPress={() => (navigation as any).getParent()?.navigate('About')}
            delay={220}
          />
          <Animated.View entering={SlideInDown.delay(300).duration(500)} style={styles.proHint}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textOnOlive} />
            <Text style={styles.proHintText}>Professional assistant for plant diagnostics and guidance.</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pulseOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#dce8b2',
    top: -70,
    right: -70,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textOnOlive,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    letterSpacing: 1,
  },
  menu: { width: '100%', maxWidth: 330, gap: 12, paddingBottom: 16 },
  proHint: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  proHintText: {
    flex: 1,
    color: colors.textOnOlive,
    fontSize: 13,
    lineHeight: 18,
  },
  menuBtn: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
    }),
  },
  menuBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
});
