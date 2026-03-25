import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';
import { forgotPasswordRequest } from '../services/authApi';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your email' });
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      Toast.show({ type: 'success', text1: 'Check your email', text2: 'Use the code we sent to reset your password.' });
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Request failed', text2: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>We’ll email you a one-time code if an account exists.</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <GradientButton title="Send code" onPress={onSubmit} loading={loading} />
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
  },
});
