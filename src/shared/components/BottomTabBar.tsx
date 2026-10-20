/** Custom bottom nav: 4 tab + FAB Kasir (bukan tab, tanpa state aktif). */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';

import { AppIcon } from './AppIcon';
import type { AppIconKey } from '@/core/constants/appIcons';
import { useTheme } from '@/store/themeStore';
import { hapticLight, hapticMedium } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

const TAB_META: Record<string, { label: string; icon: AppIconKey }> = {
  index: { label: 'Dashboard', icon: 'nav_dashboard' },
  produk: { label: 'Produk', icon: 'nav_produk' },
  riwayat: { label: 'Riwayat', icon: 'nav_riwayat' },
  pengaturan: { label: 'Pengaturan', icon: 'nav_pengaturan' },
};

export function BottomTabBar({ state, navigation }: BottomTabBarProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderTab = (routeName: string) => {
    const route = state.routes.find((item) => item.name === routeName);
    if (!route) return null;
    const index = state.routes.indexOf(route);
    const active = state.index === index;
    const meta = TAB_META[routeName] ?? { label: route.name, icon: 'nav_dashboard' as AppIconKey };
    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={active ? { selected: true } : {}}
        accessibilityLabel={meta.label}
        onPress={() => {
          hapticLight();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={styles.tab}
      >
        <AppIcon
          name={meta.icon}
          size={24}
          tintColor={active ? colors.primary : '#8A8A8A'}
          opacity={active ? 1 : 0.85}
        />
        <Text style={[styles.label, { color: active ? colors.primary : '#8A8A8A', fontWeight: active ? '800' : '500' }]}>
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {renderTab('index')}
      {renderTab('produk')}
      <View style={styles.fabSlot}>
        <Pressable
          onPress={() => {
            hapticMedium();
            router.push('/kasir');
          }}
          accessibilityRole="button"
          accessibilityLabel="Kasir"
          style={({ pressed }) => [
            styles.fab,
            { opacity: pressed ? 0.9 : 1, borderColor: colors.danger, backgroundColor: colors.primary },
          ]}
        >
          <AppIcon name="btn_kasir" size={28} />
          <Text style={styles.fabLabel}>Kasir</Text>
        </Pressable>
      </View>
      {renderTab('riwayat')}
      {renderTab('pengaturan')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 6,
    shadowColor: '#0C3B6E',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    overflow: 'visible',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
  label: { fontSize: 11 },
  fabSlot: { width: ms(88), alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: ms(76),
    height: ms(76),
    borderRadius: ms(76) / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -34,
    gap: 1,
    shadowColor: '#0C3B6E',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabLabel: { fontSize: 10, fontWeight: '900', color: '#000000' },
});
