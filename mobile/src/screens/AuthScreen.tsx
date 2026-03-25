import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Authentication failed';
}

export function AuthScreen() {
  const navigation = useNavigation<Nav>();
  const { signIn, registerAccount } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Missing info', text2: 'Please enter email and password.' });
      return;
    }
    if (mode === 'signup') {
      if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Complete the form',
          text2: 'Name, phone, and full address are required for delivery.',
        });
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        Toast.show({ type: 'success', text1: 'Signed in' });
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MainTabs');
      } else {
        await registerAccount({
          email,
          password,
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          postalCode,
          country,
        });
        Toast.show({ type: 'success', text1: 'Account created' });
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MainTabs');
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Auth error', text2: authErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <StatusBar style="dark" />
        <Animated.View entering={FadeInDown.duration(300)} style={styles.inner}>
          <GlassCard style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="leaf-outline" size={28} color={colors.olive} />
              </View>
              <Text style={styles.title}>Leaf Doctor</Text>
              <Text style={styles.subtitle}>
                {mode === 'signin' ? 'Sign in to analyze and order' : 'Create your account'}
              </Text>
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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />

            {mode === 'signup' ? (
              <>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full name"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Phone"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={addressLine1}
                  onChangeText={setAddressLine1}
                  placeholder="Address line 1"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={addressLine2}
                  onChangeText={setAddressLine2}
                  placeholder="Address line 2 (optional)"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="Postal code"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Country code (e.g. US)"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
              </>
            ) : null}

            <GradientButton
              title={mode === 'signin' ? 'Sign in' : 'Create account'}
              onPress={onSubmit}
              loading={loading}
            />
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 32 },
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
  subtitle: { marginTop: 4, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 8 },
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
  linkRow: { marginBottom: 12, alignItems: 'flex-end' },
  link: { color: colors.olive, fontWeight: '600', fontSize: 14 },
});
