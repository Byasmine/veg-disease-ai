import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

export function ProfileSettingsStarterScreen() {
  const { user, signOutUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      Toast.show({ type: 'success', text1: 'Signed out' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not sign out',
        text2: error instanceof Error ? error.message : 'Try again.',
      });
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GlassCard style={styles.card}>
        <Ionicons name="person-circle-outline" size={44} color={colors.olive} style={styles.icon} />
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.text}>Signed in as</Text>
        <Text style={styles.email}>{user?.email ?? 'Unknown user'}</Text>
        <GradientButton title="Sign out" onPress={handleSignOut} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginTop: 10 },
  icon: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  text: { color: colors.textSecondary, lineHeight: 22 },
  email: { marginBottom: 14, color: colors.textPrimary, fontWeight: '700' },
});
