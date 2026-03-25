import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { GradientButton } from '../../components/GradientButton';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { goToAuth } from '../../navigation/navigationRef';

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOutUser, updateProfile, uploadAvatar, changePassword } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
      setAddressLine1(user.addressLine1);
      setAddressLine2(user.addressLine2);
      setCity(user.city);
      setPostalCode(user.postalCode);
      setCountry(user.country || 'US');
    }
  }, [user]);

  const pickAvatar = useCallback(async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Allow photo library access.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      await uploadAvatar(result.assets[0].uri);
      Toast.show({ type: 'success', text1: 'Photo updated' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }, [user, uploadAvatar]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim() || 'US',
      });
      Toast.show({ type: 'success', text1: 'Profile saved' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (newPw.length < 6) {
      Toast.show({ type: 'error', text1: 'Password too short', text2: 'Use at least 6 characters.' });
      return;
    }
    if (newPw !== newPw2) {
      Toast.show({ type: 'error', text1: 'Mismatch', text2: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setNewPw2('');
      Toast.show({ type: 'success', text1: 'Password changed' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not change password', text2: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Ionicons name="person-circle-outline" size={44} color={colors.olive} style={styles.icon} />
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.text}>Sign in to manage your account, orders, and delivery details.</Text>
          <GradientButton title="Sign in or register" onPress={() => goToAuth(navigation)} />
        </GlassCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.avatarRow}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          )}
          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={pickAvatar}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color={colors.olive} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={18} color={colors.olive} />
                <Text style={styles.changePhotoText}>Change photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Address line 1" value={addressLine1} onChangeText={setAddressLine1} />
        <Field label="Address line 2" value={addressLine2} onChangeText={setAddressLine2} />
        <Field label="City" value={city} onChangeText={setCity} />
        <Field label="Postal code" value={postalCode} onChangeText={setPostalCode} />
        <Field label="Country" value={country} onChangeText={setCountry} />

        <GradientButton title="Save profile" onPress={saveProfile} loading={saving} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Change password</Text>
        <Field label="Current password" value={currentPw} onChangeText={setCurrentPw} secure />
        <Field label="New password" value={newPw} onChangeText={setNewPw} secure />
        <Field label="Confirm new password" value={newPw2} onChangeText={setNewPw2} secure />
        <TouchableOpacity style={styles.secondaryBtn} onPress={onChangePassword} disabled={saving}>
          <Text style={styles.secondaryBtnText}>Update password</Text>
        </TouchableOpacity>
      </GlassCard>

      <GradientButton title="Sign out" onPress={() => signOutUser().then(() => Toast.show({ type: 'success', text1: 'Signed out' }))} />
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        autoCapitalize={secure ? 'none' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 48 },
  card: { marginBottom: 16 },
  icon: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  email: { color: colors.textSecondary, marginBottom: 16 },
  text: { color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.border },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.olive,
  },
  changePhotoText: { color: colors.olive, fontWeight: '600' },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
  },
  secondaryBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.olive,
  },
  secondaryBtnText: { color: colors.olive, fontWeight: '700' },
});
