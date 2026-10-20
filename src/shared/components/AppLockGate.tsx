/**
 * App lock: background -> locked overlay; resume -> overlay + PIN modal.
 * A wrong PIN keeps the overlay (never auto-logout). Logout only from Akun.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View, type AppStateStatus } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/store/themeStore';
import { PinPad } from './PinPad';
import { AppIcon } from './AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppLockGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLocked = useAuthStore((s) => s.isLocked);
  const lock = useAuthStore((s) => s.lock);
  const verifyAppPin = useAuthStore((s) => s.verifyAppPin);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasActive = appState.current === 'active';
      appState.current = next;
      if (wasActive && next !== 'active' && useAuthStore.getState().isAuthenticated) {
        lock();
        setShowPin(true);
      }
    });
    return () => subscription.remove();
  }, [lock]);

  useEffect(() => {
    if (!isLocked) {
      setShowPin(false);
      setError(null);
    }
  }, [isLocked]);

  return (
    <View style={styles.root}>
      {children}
      {isAuthenticated && isLocked ? (
        <View style={[styles.overlay, { backgroundColor: colors.bg, paddingTop: insets.top + 24 }]}>
          {showPin ? (
            <View style={styles.pinWrapper}>
              <Text style={[styles.overlayTitle, { color: colors.text }]}>Masukkan PIN</Text>
              <PinPad
                error={error}
                onComplete={async (pin) => {
                  const ok = await verifyAppPin(pin);
                  if (ok) {
                    setError(null);
                    setShowPin(false);
                  } else {
                    setError('PIN salah');
                  }
                }}
              />
              <Pressable onPress={() => setShowPin(false)} accessibilityRole="button">
                <Text style={[styles.cancel, { color: colors.textMuted }]}>Batal</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.center}>
              <AppIcon name="login_gembok" size={72} />
              <Text style={[styles.overlayTitle, { color: colors.text }]}>Aplikasi Terkunci</Text>
              <Text style={[styles.overlaySubtitle, { color: colors.textMuted }]}>
                Demi keamanan, masukkan PIN Anda untuk melanjutkan.
              </Text>
              <Pressable
                onPress={() => setShowPin(true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.unlockButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.unlockLabel}>Masukkan PIN</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  overlaySubtitle: { fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 19 },
  unlockButton: { marginTop: 8, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  unlockLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  pinWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cancel: { fontSize: 13, fontWeight: '700', padding: 8 },
});
