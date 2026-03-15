import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export function AboutScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(400)} style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={40} color={colors.olive} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <Text style={styles.title}>Leaf Doctor</Text>
        <Text style={styles.subtitle}>by Agilicis</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(140).springify()}>
        <Text style={styles.body}>
          Leaf Doctor uses AI to help identify plant diseases from leaf images. Scan a leaf to get instant diagnosis, treatment suggestions, and reasoning.
        </Text>
        <Text style={[styles.body, styles.marginTop]}>
          This app is delivered by Agilicis. Feedback and corrections you submit help improve the model over time.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 48, alignItems: 'center' },
  logoWrap: { marginBottom: 16 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 24 },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, textAlign: 'center' },
  marginTop: { marginTop: 16 },
});
