import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { CenteredTitleHeader } from '@/shared/components/CenteredTitleHeader';
import { Card } from '@/shared/components/Card';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SecondaryButton } from '@/shared/components/SecondaryButton';
import { useTheme } from '@/store/themeStore';
import {
  DEFAULT_INVOICE_TERMS,
  getInvoiceTemplateSettings,
  saveInvoiceTemplateSettings,
} from '@/features/invoice/invoiceService';
import { getNumberSetting, getSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

export default function InvoiceSetupScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const [npwp, setNpwp] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(DEFAULT_INVOICE_TERMS);
  const [counter, setCounter] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [settings, count, name, alamat, telp] = await Promise.all([
      getInvoiceTemplateSettings(),
      getNumberSetting(SETTINGS_KEYS.invoiceCounter, 0),
      getSetting(SETTINGS_KEYS.bumdesNama, ''),
      getSetting(SETTINGS_KEYS.strukAlamat, ''),
      getSetting(SETTINGS_KEYS.strukTelp, ''),
    ]);
    setNpwp(settings.npwp);
    setNotes(settings.notes);
    setTerms(settings.terms || DEFAULT_INVOICE_TERMS);
    setCounter(count);
    setStoreName(name ?? '');
    setAddress(alamat ?? '');
    setPhone(telp ?? '');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <CenteredTitleHeader title="Setup Invoice" subtitle="Identitas kop dan pengaturan default" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>KOP INVOICE (dari Profil)</Text>
          <Text style={[styles.line, { color: colors.textMuted }]}>{storeName || 'Nama BUMDes belum diisi'}</Text>
          <Text style={[styles.line, { color: colors.textMuted }]}>{address || 'Alamat belum diisi'}</Text>
          <Text style={[styles.line, { color: colors.textMuted }]}>{phone || 'Telepon belum diisi'}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Kop memakai identitas profil & logo aplikasi agar konsisten di struk, invoice, dan laporan.
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>DEFAULT INVOICE</Text>
          <CustomTextField label="No. NPWP" value={npwp} onChangeText={setNpwp} placeholder="00.000.000.0-000.000" />
          <CustomTextField label="Keterangan" value={notes} onChangeText={setNotes} multiline placeholder="Catatan default invoice" />
          <CustomTextField label="Syarat & Ketentuan" value={terms} onChangeText={setTerms} multiline />
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Nomor invoice berikutnya: INV/{String(counter >= 999999 ? 1 : counter + 1).padStart(6, '0')} (reset otomatis setelah 999999)
          </Text>
        </Card>

        <PrimaryButton
          label="Simpan Pengaturan"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await saveInvoiceTemplateSettings({ npwp, notes, terms });
              hapticSuccess();
              showBanner('Pengaturan invoice disimpan.', { type: 'success' });
            } finally {
              setSaving(false);
            }
          }}
        />
        <SecondaryButton label="Kembali" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  line: { fontSize: 12 },
  hint: { fontSize: 10, lineHeight: 15 },
});
