import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors } from '../theme/colors';
import { sendFeedback, sendFeedbackWithImage } from '../services/api';
import { GradientButton } from '../components/GradientButton';
import { LabelSelect } from '../components/LabelSelect';
import { IconHeart, IconLeaf, IconChat, IconSend, IconBack } from '../components/Icons';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = {
  route: { params: RootStackParamList['Feedback'] };
  navigation: NativeStackNavigationProp<RootStackParamList, 'Feedback'>;
};

export function FeedbackScreen({ route, navigation }: Props) {
  const { predicted_label, correct_label: initialCorrect, confidence, imageUri } = route.params ?? {};
  const [correctLabel, setCorrectLabel] = useState(initialCorrect ?? '');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!correctLabel.trim()) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please select the correct diagnosis.' });
      return;
    }
    setSending(true);
    const payload = {
      predicted_label: predicted_label ?? '',
      correct_label: correctLabel.trim(),
      confidence: confidence ?? 0,
      user_comment: comment.trim() || undefined,
    };
    try {
      if (imageUri) {
        const res = await sendFeedbackWithImage(payload, imageUri);
        const imageStored = res?.image_uploaded === true;
        Toast.show({
          type: 'success',
          text1: 'Thank you',
          text2: imageStored
            ? 'Feedback and image uploaded to cloud for review.'
            : 'Feedback saved. Add Cloudinary to .env to store images in cloud.',
        });
      } else {
        await sendFeedback(payload);
        Toast.show({
          type: 'success',
          text1: 'Thank you',
          text2: 'Your feedback helps improve the model.',
        });
      }
      setTimeout(() => navigation.navigate('Home'), 1500);
    } catch (e: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e instanceof Error ? e.message : 'Could not send feedback.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(300)} style={styles.titleRow}>
        <IconHeart size={28} />
        <View>
          <Text style={styles.title}>Help improve the AI</Text>
          <Text style={styles.hint}>
            Predicted: {predicted_label ?? '—'} ({((confidence ?? 0) * 100).toFixed(0)}% confidence)
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={styles.labelRow}>
          <IconLeaf size={18} />
          <Text style={styles.label}>Correct disease *</Text>
        </View>
        <LabelSelect
          value={correctLabel}
          onSelect={setCorrectLabel}
          placeholder="e.g. Septoria leaf spot or healthy"
          disabled={sending}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <View style={styles.labelRow}>
          <IconChat size={18} />
          <Text style={styles.label}>Comment (optional)</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comment}
          onChangeText={setComment}
          placeholder="Any additional details..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          editable={!sending}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <GradientButton
          title={sending ? 'Sending…' : 'Send feedback'}
          icon={<IconSend size={20} />}
          onPress={handleSubmit}
          loading={sending}
          disabled={sending}
        />
        <GradientButton
          title="Cancel"
          icon={<IconBack size={20} color={colors.olive} />}
          onPress={() => navigation.goBack()}
          variant="outline"
          disabled={sending}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { padding: 24, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
});
