import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/shared/components/AppIcon';
import { useTheme } from '@/store/themeStore';
import type { LowStockProduct } from '@/data/repositories/productRepository';
import { formatQuantity } from '@/core/utils/currency';

type Props = { items: LowStockProduct[]; onPress: () => void };

export function StockAlertCard({ items, onPress }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Notifikasi stok"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <AppIcon name="dash_stok_alert" size={22} />
        <Text style={[styles.headerText, { color: colors.text }]}>
          {items.length > 0 ? `${items.length} produk perlu restok` : 'Notifikasi Stok'}
        </Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          {'Semua stok aman (tidak ada produk dengan stok < 2)'}
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={[styles.row, { borderTopColor: colors.border }]}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.stock, { color: item.stock <= 0 ? colors.danger : colors.gold }]}>
                {item.stock <= 0 ? 'Stok habis' : `Sisa ${formatQuantity(item.stock)} ${item.unit}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 13, fontWeight: '800' },
  empty: { fontSize: 12, lineHeight: 18, paddingBottom: 2 },
  list: { gap: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth },
  name: { flex: 1, fontSize: 12, fontWeight: '600' },
  stock: { fontSize: 11, fontWeight: '800' },
});
