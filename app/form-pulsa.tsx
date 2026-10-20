import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { PageHeader } from '@/shared/components/PageHeader';
import { CustomTextField } from '@/shared/components/CustomTextField';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useTheme } from '@/store/themeStore';
import { useCartStore, type PulsaServiceData } from '@/store/cartStore';
import { isPhoneID } from '@/core/utils/validators';
import { formatRupiah } from '@/core/utils/currency';
import { showBanner } from '@/store/bannerStore';
import { hapticSuccess } from '@/core/utils/haptics';

const PROVIDERS = ['Telkomsel', 'Indosat', 'XL', 'Tri', 'Axis', 'Smartfren'];
const JENIS = ['Pulsa', 'Paket Data'];

export default function FormPulsaScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
  const addServiceItem = useCartStore((s) => s.addServiceItem);
  const [nomor, setNomor] = useState('');
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [jenis, setJenis] = useState(JENIS[0]);
  const [paket, setPaket] = useState('');
  const [harga, setHarga] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!isPhoneID(nomor)) nextErrors.nomor = 'Nomor HP tidak valid.';
    if (!paket.trim()) nextErrors.paket = 'Nama paket wajib diisi.';
    if (harga <= 0) nextErrors.harga = 'Harga wajib lebih dari 0.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const serviceData: PulsaServiceData = {
      type: 'pulsa',
      nomor: nomor.trim(),
      provider,
      jenis,
      paket: paket.trim(),
      harga,
    };
    addServiceItem({
      name: `${jenis} ${provider} ${paket.trim()}`,
      price: harga,
      unit: 'jasa',
      serviceType: 'pulsa',
      serviceData,
      costAmount: 0,
    });
    hapticSuccess();
    showBanner('Pulsa/Paket Data masuk keranjang.', { type: 'success' });
    router.back();
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <PageHeader title="Pulsa / Paket Data" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CustomTextField
          label="Nomor HP"
          required
          value={nomor}
          onChangeText={setNomor}
          keyboardType="phone-pad"
          placeholder="08xxxxxxxxxx"
          error={errors.nomor}
        />

        <Text style={[styles.label, { color: colors.text }]}>Provider</Text>
        <View style={styles.chips}>
          {PROVIDERS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setProvider(item)}
              style={[
                styles.chip,
                provider === item
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { borderColor: colors.border },
              ]}
            >
              <Text style={{ color: provider === item ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Jenis</Text>
        <View style={styles.chips}>
          {JENIS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setJenis(item)}
              style={[
                styles.chip,
                jenis === item
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { borderColor: colors.border },
              ]}
            >
              <Text style={{ color: jenis === item ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <CustomTextField
          label="Nama Paket"
          required
          value={paket}
          onChangeText={setPaket}
          placeholder="Contoh: 10 GB / 30 hari"
          error={errors.paket}
        />
        <CurrencyInput label="Harga" required value={harga} onChange={setHarga} error={errors.harga} />

        <View style={[styles.totalBox, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{formatRupiah(harga)}</Text>
        </View>

        <PrimaryButton label="Tambah ke Keranjang" onPress={submit} icon="kasir_keranjang" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  totalBox: { borderWidth: 1.5, borderRadius: 12, padding: 14, gap: 2 },
  totalLabel: { fontSize: 10, fontWeight: '800' },
  totalValue: { fontSize: 26, fontWeight: '900' },
});
