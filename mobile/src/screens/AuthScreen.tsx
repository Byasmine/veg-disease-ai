import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

function getFirebaseMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Authentication failed';
  if (raw.includes('auth/invalid-credential')) return 'Invalid email or password.';
  if (raw.includes('auth/email-already-in-use')) return 'This email is already registered.';
  if (raw.includes('auth/invalid-email')) return 'Please enter a valid email address.';
  if (raw.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (raw.includes('auth/api-key-not-valid')) return 'Firebase API key is invalid. Check your .env.';
  return raw;
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Missing info', text2: 'Please enter email and password.' });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      Toast.show({
        type: 'success',
        text1: mode === 'signin' ? 'Signed in' : 'Account created',
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Auth error', text2: getFirebaseMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(300)} style={styles.inner}>
        <GlassCard style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="leaf-outline" size={28} color={colors.olive} />
            </View>
            <Text style={styles.title}>Leaf Doctor</Text>
            <Text style={styles.subtitle}>Sign in to use your real account</Text>
          </View>

          <View style={styles.switchRow}>
            <TouchableOpacity
              onPress={() => setMode('signin')}
              style={[styles.switchBtn, mode === 'signin' && styles.switchBtnActive]}
            >
              <Text style={[styles.switchText, mode === 'signin' && styles.switchTextActive]}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('signup')}
              style={[styles.switchBtn, mode === 'signup' && styles.switchBtnActive]}
            >
              <Text style={[styles.switchText, mode === 'signup' && styles.switchTextActive]}>Sign up</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <GradientButton
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            onPress={onSubmit}
            loading={loading}
          />
        </GlassCard>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: 20 },
  inner: { width: '100%' },
  card: { paddingTop: 24 },
  header: { alignItems: 'center', marginBottom: 18 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive + '18',
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: { marginTop: 4, color: colors.textSecondary },
  switchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  switchBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchBtnActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  switchText: { color: colors.textPrimary, fontWeight: '700' },
  switchTextActive: { color: colors.textOnOlive },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
});
