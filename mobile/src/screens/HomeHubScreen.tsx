import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
  return (
    <AnimatedTouchable
      entering={FadeInDown.delay(delay).springify().damping(14)}
      style={styles.menuBtn}
      onPress={onPress}
      activeOpacity={0.9}
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.olive, '#5E6539', '#4a5228']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.logoWrap}>
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
            onPress={() => (navigation as any).navigate('Analyze')}
            delay={160}
          />
          <MenuButton
            icon="time-outline"
            label="History"
            onPress={() => (navigation as any).navigate('Analyze', { screen: 'History' })}
            delay={220}
          />
          <MenuButton
            icon="storefront-outline"
            label="Shop"
            onPress={() => (navigation as any).navigate('Shop')}
            delay={280}
          />
          <MenuButton
            icon="help-circle-outline"
            label="Help"
            onPress={() => (navigation as any).getParent()?.navigate('Help')}
            delay={460}
          />
          <MenuButton
            icon="information-circle-outline"
            label="About"
            onPress={() => (navigation as any).getParent()?.navigate('About')}
            delay={520}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
