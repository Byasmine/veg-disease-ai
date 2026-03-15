import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export function HelpScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(400)} style={styles.iconWrap}>
        <Ionicons name="help-circle" size={48} color={colors.olive} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <Text style={styles.title}>How to use Leaf Doctor</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <Text style={styles.heading}>1. Analyze a leaf</Text>
        <Text style={styles.body}>
          Tap <Text style={styles.bold}>Analyze</Text> on the home screen, then take a photo or upload an image of a plant leaf. The AI will detect possible diseases and suggest treatments.
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <Text style={styles.heading}>2. Check the result</Text>
        <Text style={styles.body}>
          You’ll see the predicted disease, confidence level, AI reasoning, and treatment tips. If the result is wrong, tap <Text style={styles.bold}>No, report</Text> to send feedback.
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Text style={styles.heading}>3. History</Text>
        <Text style={styles.body}>
          Open <Text style={styles.bold}>History</Text> from the welcome screen to see your past scans on this device.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 48 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 },
  heading: { fontSize: 16, fontWeight: '600', color: colors.olive, marginBottom: 6 },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginBottom: 20 },
  bold: { fontWeight: '600' },
});
