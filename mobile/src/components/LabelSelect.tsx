import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getLabels } from '../services/api';

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface LabelSelectProps {
  value: string;
  onSelect: (label: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LabelSelect({
  value,
  onSelect,
  placeholder = 'Select correct disease…',
  disabled = false,
}: LabelSelectProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLabels()
      .then((list) => {
        if (!cancelled) setLabels(list);
      })
      .catch(() => {
        if (!cancelled) setLabels([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const displayValue = value ? formatLabel(value) : '';

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[styles.triggerText, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Correct disease</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.olive} />
              </View>
            ) : (
              <FlatList
                data={labels}
                keyExtractor={(item) => item}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, item === value && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{formatLabel(item)}</Text>
                    {item === value ? (
                      <Ionicons name="checkmark" size={20} color={colors.olive} />
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  triggerDisabled: { opacity: 0.6 },
  triggerText: { fontSize: 16, color: colors.textPrimary, flex: 1 },
  placeholder: { color: colors.textSecondary },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  loader: { padding: 40, alignItems: 'center' },
  list: { maxHeight: 400 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.olive + '18' },
  optionText: { fontSize: 16, color: colors.textPrimary },
});
