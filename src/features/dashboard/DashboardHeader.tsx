import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/AppIcon';
import { useTheme } from '@/store/themeStore';
import { formatRupiah, safePercent } from '@/core/utils/currency';
import { ms } from '@/core/utils/scale';

type Props = {
  storeName: string;
  adminName: string;
  logoUri: string | null;
  gross: number;
  net: number;
  onToggleTheme: () => void;
  onLock: () => void;
};

export function DashboardHeader({ storeName, adminName, logoUri, gross, net, onToggleTheme, onLock }: Props): React.ReactElement {
  const { colors, isDark } = useTheme();
  const grossValue = Math.max(0, gross);
  const netValue = Math.max(0, net);
  const ratio = grossValue <= 0 ? 0 : safePercent((netValue / grossValue) * 100);
  const positive = ratio >= 0;

  return (
    <LinearGradient
      colors={isDark ? ['#0C3B6E', '#121212'] : ['#2F86D1', '#0C3B6E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.wrapper}
    >
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <View style={[styles.logoRing, { width: ms(42), height: ms(42), borderRadius: ms(42) / 2 }]}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={{ width: ms(36), height: ms(36), borderRadius: ms(18) }} />
            ) : (
              <AppIcon name="nav_dashboard" size={22} />
            )}
          </View>
          <View style={styles.identityTexts}>
            <Text style={styles.admin} numberOfLines={1}>
              Admin · {adminName}
            </Text>
            <Text style={styles.store} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onToggleTheme} accessibilityRole="button" accessibilityLabel="Ganti tema" style={styles.iconButton}>
            <Animated.View key={isDark ? 'dark' : 'light'} entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
              <AppIcon name="dash_theme" size={24} />
            </Animated.View>
          </Pressable>
          <Pressable onPress={onLock} accessibilityRole="button" accessibilityLabel="Tutup pembukuan" style={styles.iconButton}>
            <AppIcon name="dash_kunci" size={24} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.label}>Laba Kotor</Text>
      <Text style={styles.gross} adjustsFontSizeToFit numberOfLines={1}>
        {formatRupiah(grossValue)}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.netBox}>
          <Text style={styles.labelSmall}>Laba Bersih</Text>
          <Text style={[styles.net, { color: colors.greenAccent }]}>{formatRupiah(netValue)}</Text>
        </View>
        <View style={styles.ratioBox}>
          <Text style={styles.labelSmall}>Imbal Hasil</Text>
          <View style={styles.ratioRow}>
            <AppIcon name={positive ? 'panah_naik' : 'panah_turun'} size={16} />
            <Text style={[styles.ratio, { color: positive ? '#4ADE80' : '#F87171' }]}>
              {positive ? '+' : ''}
              {ratio.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  logoRing: { borderWidth: 2, borderColor: '#D8A93E', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0C3B6E55' },
  identityTexts: { flex: 1 },
  admin: { color: '#DCEBFA', fontSize: 11, fontWeight: '700' },
  store: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 6 },
  iconButton: { width: ms(40), height: ms(40), borderRadius: ms(20), alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF1A' },
  label: { color: '#D6E6F5', fontSize: 12, fontWeight: '700', marginTop: 4 },
  gross: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: 0.3 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  netBox: { gap: 2 },
  ratioBox: { alignItems: 'flex-end', gap: 2 },
  labelSmall: { color: '#C7DAEC', fontSize: 10, fontWeight: '700' },
  net: { fontSize: 18, fontWeight: '900' },
  ratioRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratio: { fontSize: 14, fontWeight: '900' },
});
