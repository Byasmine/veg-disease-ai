import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type R = RouteProp<RootStackParamList, 'VerifySignup'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function VerifySignupScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { email } = route.params;
  const { completeVerification, resendSignupOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const onVerify = async () => {
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: 'Enter the code', text2: 'Check your email for the 6-digit code.' });
      return;
    }
    setLoading(true);
    try {
      await completeVerification(email, code.trim());
      Toast.show({ type: 'success', text1: 'Account activated' });
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResendBusy(true);
    try {
      await resendSignupOtp(email);
      Toast.show({ type: 'success', text1: 'Code sent', text2: 'Check your inbox (and server logs in dev).' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not resend', text2: (e as Error).message });
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.sub}>We sent a 6-digit code to {email}</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={8}
          placeholder="Enter code"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <GradientButton title="Activate account" onPress={onVerify} loading={loading} />
        <TouchableOpacity style={styles.resend} onPress={onResend} disabled={resendBusy}>
          <Text style={styles.resendText}>{resendBusy ? 'Sending…' : 'Resend code'}</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream, padding: 20, justifyContent: 'center' },
  card: {},
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  sub: { color: colors.textSecondary, marginBottom: 16, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  resend: { marginTop: 16, alignItems: 'center' },
  resendText: { color: colors.olive, fontWeight: '600' },
});
