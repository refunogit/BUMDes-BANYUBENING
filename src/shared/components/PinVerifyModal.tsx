import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PinPad } from './PinPad';
import { useTheme } from '@/store/themeStore';

type Props = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onVerified: () => void;
  onCancel: () => void;
  verify: (pin: string) => Promise<boolean>;
};

/** Modal verifikasi PIN aplikasi (dipakai untuk logout, ubah username, dll). */
export function PinVerifyModal({
  visible,
  title = 'Masukkan PIN',
  subtitle = 'Verifikasi PIN aplikasi Anda untuk melanjutkan.',
  onVerified,
  onCancel,
  verify,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (!visible) {
      setError(null);
      setChecking(false);
      setResetSignal((n) => n + 1);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Tutup">
              <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
            </Pressable>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          <PinPad
            resetSignal={resetSignal}
            error={error}
            disabled={checking}
            onComplete={async (pin) => {
              setChecking(true);
              const ok = await verify(pin);
              setChecking(false);
              if (ok) {
                setError(null);
                onVerified();
              } else {
                setError('PIN salah');
                setResetSignal((n) => n + 1);
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
  card: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  close: { fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 13 },
});
