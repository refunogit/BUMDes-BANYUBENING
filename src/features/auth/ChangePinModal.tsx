/** Ubah PIN 3 tahap PinPad: PIN lama → PIN baru → konfirmasi. */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PinPad } from '@/shared/components/PinPad';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { hapticSuccess } from '@/core/utils/haptics';
import { showBanner } from '@/store/bannerStore';

type Props = { visible: boolean; onClose: () => void };

export function ChangePinModal({ visible, onClose }: Props): React.ReactElement {
  const { colors } = useTheme();
  const verifyAppPin = useAuthStore((s) => s.verifyAppPin);
  const changePin = useAuthStore((s) => s.changePin);
  const [stage, setStage] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStage('old');
      setOldPin('');
      setNewPin('');
      setError(null);
      setResetSignal((n) => n + 1);
    }
  }, [visible]);

  const title = stage === 'old' ? 'PIN Lama' : stage === 'new' ? 'PIN Baru' : 'Konfirmasi PIN Baru';
  const subtitle =
    stage === 'old'
      ? 'Masukkan PIN aplikasi saat ini.'
      : stage === 'new'
        ? 'Masukkan PIN baru 6 digit.'
        : 'Masukkan kembali PIN baru Anda.';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
            </Pressable>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          <PinPad
            key={stage}
            error={error}
            resetSignal={resetSignal}
            onChanged={() => setError(null)}
            onComplete={async (pin) => {
              if (stage === 'old') {
                const ok = await verifyAppPin(pin);
                if (!ok) {
                  setError('PIN salah');
                  setResetSignal((n) => n + 1);
                  return;
                }
                setOldPin(pin);
                setStage('new');
              } else if (stage === 'new') {
                setNewPin(pin);
                setStage('confirm');
              } else if (pin !== newPin) {
                setError('PIN tidak cocok. Silakan coba lagi.');
                setNewPin('');
                setStage('new');
                setResetSignal((n) => n + 1);
              } else {
                const ok = await changePin(oldPin, pin);
                if (ok) {
                  hapticSuccess();
                  showBanner('PIN berhasil diperbarui.', { type: 'success' });
                  onClose();
                } else {
                  setError('Gagal mengubah PIN.');
                  setStage('old');
                  setResetSignal((n) => n + 1);
                }
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  card: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900' },
  close: { fontSize: 13, fontWeight: '700' },
  subtitle: { fontSize: 12 },
});
