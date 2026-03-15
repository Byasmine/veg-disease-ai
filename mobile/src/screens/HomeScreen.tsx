import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { predictWithReasoning } from '../services/api';
import { addScan } from '../services/history';
import { GradientButton } from '../components/GradientButton';
import { AnimatedLoader } from '../components/AnimatedLoader';
import { IconLeaf, IconCamera, IconImages, IconScan, IconAlert } from '../components/Icons';
import Toast from 'react-native-toast-message';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

const LOADING_MESSAGES = [
  '🌿 Scanning leaf…',
  '🔬 Analyzing disease patterns…',
  '✨ Consulting plant knowledge base…',
];

export function HomeScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = useCallback(async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take a photo.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery access is required to pick a photo.');
        return false;
      }
    }
    return true;
  }, []);

  const pickAndCompress = useCallback(async (useCamera: boolean) => {
    const ok = await requestPermissions(useCamera);
    if (!ok) return;

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });

    if (result.canceled || !result.assets[0]) return result.assets[0]?.uri ?? null;

    const uri = result.assets[0].uri;
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  }, [requestPermissions]);

  const handleScan = useCallback(async () => {
    setError(null);
    let uri: string | null = null;

    if (imageUri) {
      uri = imageUri;
    } else {
      const picked = await pickAndCompress(false);
      if (!picked) return;
      uri = picked;
      setImageUri(picked);
    }

    if (!uri) return;

    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    const messageInterval = setInterval(() => {
      setLoadingMessage((prev) => {
        const i = LOADING_MESSAGES.indexOf(prev);
        const next = LOADING_MESSAGES[(i + 1) % LOADING_MESSAGES.length];
        return next;
      });
    }, 2000);

    try {
      const data = await predictWithReasoning(uri);
      clearInterval(messageInterval);
      await addScan({
        timestamp: new Date().toISOString(),
        prediction: data.prediction ?? '',
        confidence: data.confidence ?? 0,
        status: data.status ?? 'Success',
        imageUri: uri,
      });
      navigation.navigate('Result', { imageUri: uri, result: data });
      setImageUri(null);
    } catch (e: unknown) {
      clearInterval(messageInterval);
      const msg = e instanceof Error ? e.message : 'Request failed';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Scan failed', text2: msg });
    } finally {
      setLoading(false);
    }
  }, [imageUri, pickAndCompress, navigation]);

  const takePhoto = useCallback(async () => {
    const uri = await pickAndCompress(true);
    if (uri) setImageUri(uri);
  }, [pickAndCompress]);

  const uploadFromGallery = useCallback(async () => {
    const uri = await pickAndCompress(false);
    if (uri) setImageUri(uri);
  }, [pickAndCompress]);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Animated.View entering={FadeIn}>
          <AnimatedLoader message={loadingMessage} icon={<IconLeaf size={64} />} />
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.titleRow}>
        <IconLeaf size={32} />
        <View>
          <Text style={styles.title}>Plant Health Scanner</Text>
          <Text style={styles.subtitle}>Scan a leaf to detect disease instantly</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.captureArea}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <IconLeaf size={48} color={colors.taupe} />
            <Text style={styles.placeholderText}>No image selected</Text>
            <Text style={styles.placeholderSub}>Take a photo or upload from gallery</Text>
          </View>
        )}
        <View style={styles.captureActions}>
          <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
            <IconCamera size={20} />
            <Text style={styles.captureBtnText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={uploadFromGallery}>
            <IconImages size={20} />
            <Text style={styles.captureBtnText}>Upload image</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.ctaWrap}>
        <GradientButton
          title="Scan Leaf"
          icon={<IconScan size={22} />}
          onPress={handleScan}
          disabled={!imageUri}
        />
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <IconAlert size={18} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { padding: 24, paddingBottom: 48 },
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  captureArea: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
      web: {},
    }),
  },
  preview: { width: '100%', height: 280, backgroundColor: colors.card },
  placeholder: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  placeholderText: { fontSize: 16, color: colors.textSecondary, marginTop: 8 },
  placeholderSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  captureActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  captureBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureBtnText: { color: colors.olive, fontSize: 15, fontWeight: '600' },
  ctaWrap: { marginBottom: 16 },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  error: { color: colors.danger, textAlign: 'center' },
});
