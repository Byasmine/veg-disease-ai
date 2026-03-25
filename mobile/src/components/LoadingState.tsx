import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

export type LoadingStateProps = {
  message?: string;
  style?: ViewStyle;
};

export function LoadingState({ message, style }: LoadingStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator size="large" color={colors.olive} />
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  msg: { marginTop: 12, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});

