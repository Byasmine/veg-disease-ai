import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { ProbabilityBar } from '../components/ProbabilityBar';
import { GradientButton } from '../components/GradientButton';
import {
  IconLeaf,
  IconSuccess,
  IconWarning,
  IconError,
  IconBulb,
  IconMedical,
  IconList,
  IconThumbsUp,
  IconThumbsDown,
  IconDocument,
} from '../components/Icons';
import { TreatmentSolutions } from '../components/TreatmentSolutions';
import { generateAndShareReportPdf } from '../services/reportPdf';
import Toast from 'react-native-toast-message';
import type { AnalyzeStackParamList } from '../navigation/analyzeStackTypes';
import type { PredictionResponse } from '../types/api';

type ConfidenceLevel = 'High' | 'Moderate' | 'Low';

function getConfidenceLevel(confidence: number): { level: ConfidenceLevel; color: string } {
  if (confidence >= 0.8) return { level: 'High', color: colors.success };
  if (confidence >= 0.55) return { level: 'Moderate', color: colors.warning };
  return { level: 'Low', color: colors.danger };
}

const DIAGNOSTIC_STEPS = [
  'Leaf image analyzed',
  'Disease patterns detected',
  'Knowledge base consulted',
  'Diagnosis generated',
];

function treatmentToBullets(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[.;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  route: { params: { imageUri: string; result: PredictionResponse } };
  navigation: NativeStackNavigationProp<AnalyzeStackParamList, 'Result'>;
};

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ResultScreen({ route, navigation }: Props) {
  const { imageUri, result } = route.params ?? {};
  const dr = result?.diagnostic_report ?? {};
  const llm = result?.llm_reasoning;
  const agent = result?.agent_decision ?? {};
  const top3 = (result?.top_k ?? []).slice(0, 3);

  const fallbackReason = [dr.summary, agent.reason].filter(Boolean).join(' ').trim();
  const reasoningText = (llm?.reasoning ?? fallbackReason) || '';
  const recommendationText = llm?.recommendation ?? agent.next_action ?? '';
  const hasReasoning = reasoningText.length > 0 || recommendationText.length > 0;

  const goFeedback = () => {
    navigation.navigate('Feedback', {
      predicted_label: result?.prediction ?? '',
      correct_label: result?.prediction ?? '',
      confidence: result?.confidence ?? 0,
      imageUri: imageUri ?? '',
    });
  };

  const statusColor =
    result?.status === 'Success'
      ? colors.success
      : result?.status === 'Uncertain'
        ? colors.warning
        : colors.danger;
  const StatusIconComponent =
    result?.status === 'Success'
      ? IconSuccess
      : result?.status === 'Uncertain'
        ? IconWarning
        : IconError;

  const confidenceVal = result?.confidence ?? 0;
  const { level: confidenceLevel, color: confidenceLevelColor } = getConfidenceLevel(confidenceVal);
  const treatmentBullets = dr.recommended_treatment ? treatmentToBullets(dr.recommended_treatment) : [];
  const maxTopConfidence = top3.length > 0 ? Math.max(...top3.map((t) => t.confidence), 0.01) : 1;

  const [pdfLoading, setPdfLoading] = useState(false);
  const handleDownloadReport = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      await generateAndShareReportPdf(result, imageUri ?? null);
      if (Platform.OS !== 'web') {
        Toast.show({ type: 'success', text1: 'Report ready', text2: 'Save or share from the dialog.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not create report', text2: (e as Error)?.message });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      {imageUri ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <GlassCard style={styles.card}>
          <View style={[styles.badge, { backgroundColor: statusColor + '22', flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <StatusIconComponent size={18} color={statusColor as string} />
            <Text style={[styles.badgeText, { color: statusColor }]}>{result?.status ?? '—'}</Text>
          </View>
          <View style={styles.diseaseRow}>
            <IconLeaf size={26} />
            <Text style={styles.diseaseName}>{formatLabel(result?.prediction ?? '')}</Text>
          </View>
          <View style={styles.confidenceLevelRow}>
            <View style={[styles.confidenceLevelBadge, { backgroundColor: confidenceLevelColor + '22' }]}>
              <Text style={[styles.confidenceLevelText, { color: confidenceLevelColor }]}>
                AI Confidence — {confidenceLevel}
              </Text>
            </View>
          </View>
          <ConfidenceBar confidence={confidenceVal} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>AI Diagnostic Process</Text>
          {DIAGNOSTIC_STEPS.map((step, i) => (
            <Animated.View
              key={step}
              entering={FadeInDown.delay(180 + i * 60).springify()}
              style={[styles.timelineRow, i < DIAGNOSTIC_STEPS.length - 1 && styles.timelineRowNotLast]}
            >
              <View style={styles.timelineIconWrap}>
                <IconSuccess size={18} color={colors.success} />
              </View>
              <Text style={styles.timelineText}>{step}</Text>
            </Animated.View>
          ))}
        </GlassCard>
      </Animated.View>

      {result?.status === 'Uncertain' ? (
        <Animated.View entering={FadeInDown.delay(190).springify()}>
          <GlassCard style={StyleSheet.flatten([styles.card, styles.uncertaintyCard])}>
            <View style={styles.uncertaintyRow}>
              <IconWarning size={22} color={colors.warning} />
              <Text style={styles.uncertaintyTitle}>The AI is not fully confident in this diagnosis.</Text>
            </View>
            <Text style={styles.uncertaintyBody}>
              This result may overlap with other diseases. You may want to upload another image or inspect the plant more closely.
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {hasReasoning ? (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <IconBulb size={18} />
              <Text style={styles.sectionTitle}>AI Analysis</Text>
            </View>
            {reasoningText.length > 0 ? (
              <Text style={styles.reasoningBody}>{reasoningText}</Text>
            ) : null}
            {recommendationText.length > 0 ? (
              <Text style={[styles.body, styles.recommendation]}>{recommendationText}</Text>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {dr.recommended_treatment ? (
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <IconLeaf size={18} />
              <Text style={styles.sectionTitle}>Recommended Action</Text>
            </View>
            {treatmentBullets.length > 0 ? (
              <View style={styles.bulletList}>
                {treatmentBullets.map((bullet, i) => (
                  <Text key={i} style={styles.bulletItem}>• {bullet}</Text>
                ))}
              </View>
            ) : (
              <Text style={styles.body}>{dr.recommended_treatment}</Text>
            )}
            <TreatmentSolutions treatmentText={dr.recommended_treatment} />
          </GlassCard>
        </Animated.View>
      ) : null}

      {top3.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <IconList size={18} />
              <Text style={styles.sectionTitle}>Top Possible Diseases</Text>
            </View>
            {top3.map((item, i) => (
              <ProbabilityBar
                key={i}
                label={formatLabel(item.label)}
                confidence={item.confidence}
                maxConfidence={maxTopConfidence}
                delay={i * 80}
              />
            ))}
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.feedbackSection}>
        <Text style={styles.feedbackQuestion}>Did the AI get it right?</Text>
        <View style={styles.feedbackButtons}>
          <TouchableOpacity style={styles.yesBtn} onPress={() => navigation.goBack()}>
            <IconThumbsUp size={20} />
            <Text style={styles.yesBtnText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noBtn} onPress={goFeedback}>
            <IconWarning size={20} />
            <Text style={styles.noBtnText}>Report mistake</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(380).springify()} style={styles.pdfSection}>
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={handleDownloadReport}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ActivityIndicator size="small" color={colors.olive} />
          ) : (
            <>
              <IconDocument size={20} color={colors.olive} />
              <Text style={styles.pdfButtonText}>Download report PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.ctaWrap}>
        <GradientButton
          title="Scan another leaf"
          icon={<IconLeaf size={22} color={colors.textOnOlive as string} />}
          onPress={() => navigation.goBack()}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { padding: 20, paddingBottom: 48 },
  thumbnail: { width: '100%', height: 200, borderRadius: 16, marginBottom: 20 },
  card: { marginBottom: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  diseaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  diseaseName: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  confidenceLevelRow: { marginBottom: 12 },
  confidenceLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confidenceLevelText: { fontSize: 13, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  recommendation: { marginTop: 10, fontStyle: 'italic', color: colors.textSecondary },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  timelineRowNotLast: { borderBottomWidth: 1, borderBottomColor: colors.border },
  timelineIconWrap: { width: 24, alignItems: 'center' },
  timelineText: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  uncertaintyCard: { borderWidth: 1, borderColor: colors.warning + '99', backgroundColor: colors.warning + '12' },
  uncertaintyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  uncertaintyTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  uncertaintyBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  reasoningBody: { fontSize: 15, color: colors.textPrimary, lineHeight: 24, letterSpacing: 0.2 },
  bulletList: { marginBottom: 4 },
  bulletItem: { fontSize: 15, color: colors.textPrimary, lineHeight: 24, marginBottom: 6 },
  feedbackSection: { marginBottom: 24 },
  feedbackQuestion: { fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  feedbackButtons: { flexDirection: 'row', gap: 12 },
  yesBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.success + '22',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  yesBtnText: { color: colors.success, fontWeight: '600' },
  noBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noBtnText: { color: colors.danger, fontWeight: '600' },
  pdfSection: { marginBottom: 16 },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.olive,
    backgroundColor: colors.olive + '12',
  },
  pdfButtonText: { fontSize: 16, fontWeight: '600', color: colors.olive },
  ctaWrap: { marginTop: 8 },
});
