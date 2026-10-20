/** Pemindai barcode — bingkai 260x160 emas, senter, auto-retry 5 dtk. */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { AppIcon } from '@/shared/components/AppIcon';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useTheme } from '@/store/themeStore';
import { hapticSuccess } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
};

const FORMATS = ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'qr'] as const;

export function ScannerModal({ visible, onClose, onScanned }: Props): React.ReactElement {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [armed, setArmed] = useState(true);
  const lastScan = useRef(0);

  useEffect(() => {
    if (!visible) {
      setArmed(true);
      setTorch(false);
      return undefined;
    }
    if (!permission?.granted) void requestPermission();
    setArmed(true);
    const retry = setInterval(() => {
      // auto-retry loop: re-arm the listener every 5 seconds until user stops
      if (Date.now() - lastScan.current > 5000) setArmed(true);
    }, 5000);
    return () => clearInterval(retry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: [...FORMATS] }}
            onBarcodeScanned={
              armed
                ? (event) => {
                    const code = event.data?.trim();
                    if (!code) return;
                    setArmed(false);
                    lastScan.current = Date.now();
                    hapticSuccess();
                    onScanned(code);
                    setTimeout(() => setArmed(true), 500);
                  }
                : undefined
            }
          />
        ) : (
          <View style={styles.permission}>
            <Text style={styles.permissionText}>Izinkan kamera untuk memindai barcode.</Text>
            <PrimaryButton label="Izinkan Kamera" onPress={() => void requestPermission()} />
          </View>
        )}

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.topBar}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Berhenti"
              style={styles.stopButton}
            >
              <Text style={styles.stopText}>Berhenti</Text>
            </Pressable>
            <Pressable
              onPress={() => setTorch((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel="Senter"
              style={[styles.torch, { backgroundColor: torch ? colors.gold : 'rgba(255,255,255,0.16)' }]}
            >
              <AppIcon name="scanner_senter" size={22} />
            </Pressable>
          </View>

          <View style={styles.center}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.hint}>Arahkan kamera ke barcode produk</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  permissionText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, marginTop: 24 },
  stopButton: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  stopText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  torch: { width: ms(46), height: ms(46), borderRadius: ms(46) / 2, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  frame: { width: ms(260), height: ms(160), borderRadius: 12, borderWidth: 3, borderColor: '#D8A93E', shadowColor: '#D8A93E', shadowOpacity: 0.9, shadowRadius: 14 },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: '#FFFFFF' },
  tl: { top: -3, left: -3, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: -3, right: -3, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: -3, left: -3, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: -3, right: -3, borderBottomWidth: 4, borderRightWidth: 4 },
  hint: { color: '#EAFBFF', fontSize: 12, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
});
