/** Global printer feedback dialog (rendered once in the root layout). */
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePrintDialogStore } from '@/store/printDialogStore';
import { useTheme } from '@/store/themeStore';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { previewReceipt, shareReceiptPdf } from '@/features/printer/printPreview';

export function PrintDialogHost(): React.ReactElement | null {
  const { visible, kind, receiptText, message, close } = usePrintDialogStore();
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {kind === 'preview' ? 'Pratinjau Struk' : message ?? 'Printer Tidak Terhubung'}
          </Text>
          {receiptText ? (
            <ScrollView style={[styles.receipt, { backgroundColor: colors.surface }]}>
              <Text style={[styles.receiptText, { color: colors.text }]}>{receiptText}</Text>
            </ScrollView>
          ) : (
            <Text style={[styles.message, { color: colors.textMuted }]}>
              Periksa printer Bluetooth Anda, lalu coba cetak ulang dari Riwayat.
            </Text>
          )}
          <View style={styles.actions}>
            <SecondaryButton label="Tutup" onPress={close} style={styles.action} />
            {receiptText ? (
              <PrimaryButton
                label="Bagikan PDF"
                onPress={() => {
                  void shareReceiptPdf(receiptText);
                }}
                style={styles.action}
              />
            ) : (
              <PrimaryButton
                label="Lihat Struk"
                onPress={() => {
                  if (receiptText) void previewReceipt(receiptText);
                }}
                style={styles.action}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 460, borderRadius: 16, padding: 18, gap: 12, maxHeight: '86%' },
  title: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  receipt: { borderRadius: 10, padding: 12, maxHeight: 360 },
  receiptText: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
