import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { useTheme } from '@/store/themeStore';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  destructive,
  loading,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          <View style={styles.actions}>
            <SecondaryButton
              label={cancelLabel}
              onPress={onCancel}
              color={colors.textMuted}
              style={styles.action}
              disabled={loading}
            />
            <PrimaryButton
              label={confirmLabel}
              onPress={onConfirm}
              color={destructive ? colors.danger : colors.primary}
              style={styles.action}
              loading={loading}
            />
          </View>
          {loading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 12, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  action: { flex: 1 },
  loading: { marginTop: 4 },
});
