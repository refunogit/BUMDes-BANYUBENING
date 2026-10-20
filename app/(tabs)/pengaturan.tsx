import React, { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/shared/components/Screen';
import { AppIcon } from '@/shared/components/AppIcon';
import type { AppIconKey } from '@/core/constants/appIcons';
import { Card } from '@/shared/components/Card';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { ImagePickField } from '@/shared/components/ImagePickField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ThemedSwitch } from '@/shared/components/ThemedSwitch';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { PinVerifyModal } from '@/shared/components/PinVerifyModal';
import { useTheme, useThemeStore } from '@/store/themeStore';
import { useAuthStore, updateProfileName } from '@/store/authStore';
import { getSetting, setManySettings } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { compressLogo } from '@/core/services/imageService';
import { fileExists } from '@/core/services/storageService';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type MenuItem = { key: string; label: string; hint: string; icon: AppIconKey; route: string };

const MENU: MenuItem[] = [
  { key: 'akun', label: 'Pengaturan Akun', hint: 'Username, PIN, keamanan', icon: 'set_akun', route: '/account-settings' },
  { key: 'printer', label: 'Printer', hint: 'Pairing & ukuran kertas', icon: 'set_printer', route: '/printer' },
  { key: 'backup', label: 'Backup & Restore', hint: 'Arsip ZIP lokal berisi DB & gambar', icon: 'set_backup', route: '/backup-restore' },
  { key: 'invoice', label: 'Setup Invoice', hint: 'Identitas & nomor invoice', icon: 'set_invoice', route: '/invoice-setup' },
  { key: 'logo', label: 'Logo Aplikasi', hint: 'Satu logo untuk semuanya', icon: 'register_upload', route: '/logo-setup' },
  { key: 'notif', label: 'Notifikasi', hint: 'Hutang & pengingat', icon: 'dash_stok_alert', route: '/notifikasi-pengaturan' },
];

export default function PengaturanScreen(): React.ReactElement {
  const { colors, isDark } = useTheme();
  const toggle = useThemeStore((s) => s.toggle);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const verifyAppPin = useAuthStore((s) => s.verifyAppPin);

  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [pinDialog, setPinDialog] = useState(false);
  const [wiping, setWiping] = useState(false);

  const load = useCallback(async () => {
    const [name, store, logoPath] = await Promise.all([
      getSetting(SETTINGS_KEYS.userNamaLengkap),
      getSetting(SETTINGS_KEYS.bumdesNama),
      getSetting(SETTINGS_KEYS.bumdesLogo),
    ]);
    setDisplayName(name ?? user?.displayName ?? '');
    setStoreName(store ?? '');
    setLogo(fileExists(logoPath) ? logoPath : null);
  }, [user?.displayName]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    if (!displayName.trim() || !storeName.trim()) {
      showBanner('Nama lengkap dan nama BUMDes wajib diisi.', { type: 'error' });
      return;
    }
    setSavingProfile(true);
    try {
      await setManySettings({
        [SETTINGS_KEYS.userNamaLengkap]: displayName.trim(),
        [SETTINGS_KEYS.bumdesNama]: storeName.trim(),
        [SETTINGS_KEYS.strukNama]: storeName.trim(),
        ...(logo ? { [SETTINGS_KEYS.bumdesLogo]: logo } : {}),
      });
      await updateProfileName(displayName.trim());
      hapticSuccess();
      showBanner('Profil disimpan.', { type: 'success' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Screen edges={['top']} padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>Pengaturan</Text>

          <Card style={styles.profileCard}>
            <View style={[styles.avatar, { width: ms(64), height: ms(64), borderRadius: ms(64) / 2, borderColor: colors.gold, backgroundColor: colors.surface }]}>
              {logo ? (
                <Image source={{ uri: logo }} style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }} />
              ) : (
                <AppIcon name="set_akun" size={30} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName || user?.displayName || 'Admin'}</Text>
              <Text style={[styles.profileStore, { color: colors.textMuted }]}>{storeName || 'BUMDes'}</Text>
              <Text style={[styles.profileRole, { color: colors.gold }]}>{(user?.role ?? 'admin').toUpperCase()} · @{user?.username ?? '-'}</Text>
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Profil</Text>
            <View style={styles.logoRow}>
              <ImagePickField
                uri={logo}
                size={110}
                circular
                icon="register_upload"
                label="Unggah Logo"
                onPick={async (picked) => {
                  const saved = await compressLogo(picked.uri, picked.width, picked.height);
                  setLogo(saved);
                }}
              />
              <View style={styles.logoHintBox}>
                <Text style={[styles.logoHint, { color: colors.textMuted }]}>
                  Satu logo dipakai di dashboard, login, struk, invoice, dan laporan PDF.
                </Text>
              </View>
            </View>
            <CustomTextField label="Nama Lengkap" value={displayName} onChangeText={setDisplayName} placeholder="Nama admin" />
            <CustomTextField label="Nama BUMDes" value={storeName} onChangeText={setStoreName} placeholder="Nama toko" />
            <PrimaryButton label="Simpan Profil" onPress={() => void saveProfile()} loading={savingProfile} />
          </Card>

          <Card style={styles.section}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.gold}18` }]}>
                <AppIcon name="set_darkmode" size={22} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.menuHint, { color: colors.textMuted }]}>Tema gelap #121212</Text>
              </View>
              <ThemedSwitch value={isDark} onValueChange={() => toggle()} />
            </View>
          </Card>

          <Card style={styles.section}>
            {MENU.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as never)}
                accessibilityRole="button"
                style={[styles.menuRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 }]}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <AppIcon name={item.icon} size={22} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.menuHint, { color: colors.textMuted }]}>{item.hint}</Text>
                </View>
                <AppIcon name="panah_naik" size={12} />
              </Pressable>
            ))}
          </Card>

          <Pressable
            onPress={() => setLogoutDialog(true)}
            accessibilityRole="button"
            style={[styles.logout, { borderColor: colors.danger }]}
          >
            <AppIcon name="set_logout" size={20} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={logoutDialog}
        title="Konfirmasi Logout"
        message={'Apakah Anda Yakin Ingin Keluar Dari Aplikasi Ini\n\nJika Iya Maka Semua Data-data Anda Akan Terhapus Selamanya'}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        destructive
        onCancel={() => setLogoutDialog(false)}
        onConfirm={() => {
          setLogoutDialog(false);
          setPinDialog(true);
        }}
      />

      <PinVerifyModal
        visible={pinDialog}
        title="Verifikasi PIN"
        subtitle="Masukkan PIN aplikasi untuk logout dan menghapus seluruh data."
        verify={verifyAppPin}
        onCancel={() => setPinDialog(false)}
        onVerified={async () => {
          setWiping(true);
          try {
            await logout();
            setPinDialog(false);
            router.replace('/login');
          } finally {
            setWiping(false);
          }
        }}
      />
      {wiping ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 16, fontWeight: '900' },
  profileStore: { fontSize: 12, fontWeight: '600' },
  profileRole: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900' },
  logoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  logoHintBox: { flex: 1 },
  logoHint: { fontSize: 11, lineHeight: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  menuIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1, gap: 1 },
  menuLabel: { fontSize: 13, fontWeight: '800' },
  menuHint: { fontSize: 10 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
  logoutText: { fontSize: 14, fontWeight: '900' },
});
