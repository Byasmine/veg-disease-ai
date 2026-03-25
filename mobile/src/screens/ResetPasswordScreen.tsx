import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';
import { resetPasswordRequest } from '../services/authApi';
import type { RootStackParamList } from '../navigation/RootNavigator';

type R = RouteProp<RootStackParamList, 'ResetPassword'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ResetPasswordScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !code.trim() || newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid input',
        text2: 'Email, code, and a new password (6+ chars) are required.',
      });
      return;
    }
    setLoading(true);
    try {
      await resetPasswordRequest(email, code, newPassword);
      Toast.show({ type: 'success', text1: 'Password updated', text2: 'You can sign in now.' });
      navigation.navigate('Auth');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.sub}>Enter the code from your email and choose a new password.</Text>
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
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="Code from email"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="New password"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <GradientButton title="Update password" onPress={onSubmit} loading={loading} />
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
    marginBottom: 12,
  },
});
