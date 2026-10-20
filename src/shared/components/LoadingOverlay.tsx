import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/store/themeStore';

type Props = { visible: boolean; label?: string };

export function LoadingOverlay({ visible, label = 'Memproses...' }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, paddingVertical: 22, paddingHorizontal: 28, alignItems: 'center', gap: 12, minWidth: 180 },
  label: { fontSize: 13, fontWeight: '600' },
});
