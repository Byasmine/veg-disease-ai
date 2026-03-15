import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/** Solution type: keyword patterns (lowercase) and icon to show */
const SOLUTION_MAP: { keywords: string[]; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { keywords: ['fungicide', 'sulfur', 'copper', 'bactericide', 'chlorothalonil', 'spray'], label: 'Apply fungicide', icon: 'flask-outline' },
  { keywords: ['air flow', 'airflow', 'ventilation', 'humidity'], label: 'Improve air flow', icon: 'sunny-outline' },
  { keywords: ['remove', 'destroy', 'infected', 'affected'], label: 'Remove affected parts', icon: 'trash-outline' },
  { keywords: ['water', 'watering', 'irrigation', 'overhead'], label: 'Adjust watering', icon: 'water-outline' },
  { keywords: ['resistant', 'varieties', 'transplants', 'seed'], label: 'Resistant varieties', icon: 'leaf-outline' },
  { keywords: ['whitefly', 'whiteflies', 'aphid', 'pest', 'miticide', 'mite'], label: 'Pest control', icon: 'bug-outline' },
  { keywords: ['mulch', 'rotate', 'crop'], label: 'Crop care', icon: 'leaf-outline' },
  { keywords: ['no cure', 'disinfect', 'tool'], label: 'Sanitation', icon: 'medkit-outline' },
];

function getSolutionsFromText(treatment: string): { label: string; icon: keyof typeof Ionicons.glyphMap }[] {
  const lower = treatment.toLowerCase();
  const seen = new Set<string>();
  const out: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [];
  for (const { keywords, label, icon } of SOLUTION_MAP) {
    if (seen.has(label)) continue;
    const match = keywords.some((k) => lower.includes(k));
    if (match) {
      seen.add(label);
      out.push({ label, icon });
    }
  }
  return out;
}

interface TreatmentSolutionsProps {
  treatmentText: string;
}

export function TreatmentSolutions({ treatmentText }: TreatmentSolutionsProps) {
  const solutions = getSolutionsFromText(treatmentText);
  if (solutions.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.subtitle}>Suggested solutions</Text>
      <View style={styles.row}>
        {solutions.map((s, i) => (
          <View key={i} style={styles.pill}>
            <Ionicons name={s.icon} size={18} color={colors.olive} />
            <Text style={styles.pillLabel} numberOfLines={1}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  subtitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.olive + '18',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    maxWidth: '48%',
  },
  pillLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
});
