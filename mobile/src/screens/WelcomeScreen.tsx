import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

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
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={1}
    >
      <View style={styles.menuBtnInner}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={24} color={colors.olive} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </AnimatedTouchable>
  );
}

export function WelcomeScreen({ navigation }: Props) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 14 });
    pulse.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      )
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * pulse.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.olive, '#5E6539', '#4a5228']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(500)} style={[styles.logoWrap, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={56} color={colors.textOnOlive} />
          </View>
          <Text style={styles.title}>LEAF DOCTOR</Text>
          <Text style={styles.subtitle}>by Agilicis</Text>
        </Animated.View>

        <View style={styles.menu}>
          <MenuButton
            icon="scan-outline"
            label="Analyze"
            onPress={() => navigation.replace('Home')}
            delay={200}
          />
          <MenuButton
            icon="time-outline"
            label="History"
            onPress={() => navigation.replace('History')}
            delay={280}
          />
          <MenuButton
            icon="help-circle-outline"
            label="Help"
            onPress={() => navigation.navigate('Help')}
            delay={360}
          />
          <MenuButton
            icon="information-circle-outline"
            label="About"
            onPress={() => navigation.navigate('About')}
            delay={440}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
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
  menu: { width: '100%', maxWidth: 320, gap: 12 },
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
