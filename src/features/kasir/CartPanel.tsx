/** Keranjang v4 — stepper 28, hapus 18 merah, total hijau, CTA sh(48). */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/shared/components/AppIcon';
import { useCartStore } from '@/store/cartStore';
import { useTheme } from '@/store/themeStore';
import { formatQuantity, formatRupiah, parseNumber, roundMoney } from '@/core/utils/currency';
import { mathParser } from '@/core/utils/mathParser';
import { hapticLight } from '@/core/utils/haptics';
import { sh, ms } from '@/core/utils/scale';

const CART_RED = '#C62828';
const CART_GREEN = '#2E7D32';

type Props = { onCheckout: () => void };

export function CartPanel({ onCheckout }: Props): React.ReactElement {
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updatePrice = useCartStore((s) => s.updatePrice);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [calcOpen, setCalcOpen] = useState(false);
  const [calcMode, setCalcMode] = useState<'qty' | 'price'>('qty');
  const [calcTarget, setCalcTarget] = useState<string | null>(null);
  const [expression, setExpression] = useState('');
  const [calcError, setCalcError] = useState<string | null>(null);

  const applyCalc = () => {
    const result = mathParser(expression);
    if (!result.ok) {
      setCalcError('Ekspresi tidak valid.');
      return;
    }
    if (!calcTarget) {
      setCalcError('Pilih item keranjang dahulu.');
      return;
    }
    if (calcMode === 'qty') {
      updateQuantity(calcTarget, roundMoney(result.value));
    } else {
      updatePrice(calcTarget, roundMoney(result.value));
    }
    setCalcError(null);
    setExpression('');
    setCalcOpen(false);
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppIcon name="kasir_keranjang" size={20} />
          <Text style={[styles.headerText, { color: colors.text }]}>{formatQuantity(itemCount)} item</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              hapticLight();
              setCalcOpen((open) => !open);
            }}
            accessibilityRole="button"
            accessibilityLabel="Kalkulator"
            style={styles.calcButton}
          >
            <AppIcon name="kasir_kalkulator" size={20} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (!items.length) return;
              hapticLight();
              clearCart();
            }}
            accessibilityRole="button"
            accessibilityLabel="Kosongkan keranjang"
          >
            <Text style={[styles.clear, { color: items.length ? CART_RED : colors.textMuted }]}>Kosongkan</Text>
          </Pressable>
        </View>
      </View>

      {calcOpen ? (
        <View style={[styles.calculator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.calcModes}>
            {(['qty', 'price'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setCalcMode(mode)}
                style={[styles.calcMode, calcMode === mode && { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: calcMode === mode ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '800' }}>
                  {mode === 'qty' ? 'Jumlah' : 'Harga'}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={expression}
            onChangeText={(value) => {
              setExpression(value);
              setCalcError(null);
            }}
            placeholder="2*3+1"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={colors.textMuted}
            style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
          />
          {calcTarget ? (
            <Text style={[styles.calcTarget, { color: colors.textMuted }]} numberOfLines={1}>
              Item: {items.find((item) => item.key === calcTarget)?.name}
            </Text>
          ) : null}
          {calcError ? <Text style={[styles.calcError, { color: colors.danger }]}>{calcError}</Text> : null}
          <View style={styles.calcActions}>
            <Pressable
              onPress={() => {
                setExpression('');
                setCalcError(null);
              }}
              style={[styles.calcApply, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>Reset</Text>
            </Pressable>
            <Pressable onPress={applyCalc} style={[styles.calcApply, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>Terapkan</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <AppIcon name="kasir_keranjang" size={56} opacity={0.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Keranjang Kosong</Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Tap produk untuk menambahkan</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setCalcTarget(item.key)}
              style={[
                styles.row,
                { borderColor: calcTarget === item.key ? colors.gold : colors.border, backgroundColor: colors.card },
              ]}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                  {formatRupiah(item.price)} / {item.unit}
                </Text>
                <Text style={[styles.rowSubtotal, { color: colors.primary }]}>
                  {formatRupiah(roundMoney(item.price * item.qty))}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    updateQuantity(item.key, roundMoney(item.qty - 1));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Kurangi"
                  style={[styles.stepper, { borderColor: colors.border }]}
                >
                  <Text style={[styles.stepperText, { color: colors.text }]}>−</Text>
                </Pressable>
                <TextInput
                  value={formatQuantity(item.qty)}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => {
                    const parsed = parseNumber(value);
                    if (Number.isFinite(parsed)) updateQuantity(item.key, parsed);
                  }}
                  style={[styles.qtyInput, { color: colors.text, borderColor: colors.border }]}
                />
                <Pressable
                  onPress={() => {
                    hapticLight();
                    updateQuantity(item.key, roundMoney(item.qty + 1));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Tambah"
                  style={[styles.stepper, { borderColor: colors.border }]}
                >
                  <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    removeItem(item.key);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus item"
                  style={styles.trash}
                >
                  <AppIcon name="produk_hapus" size={18} tintColor={CART_RED} />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.totalValue, { color: CART_GREEN }]}>{formatRupiah(total)}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (!items.length) {
              hapticLight();
              return;
            }
            hapticLight();
            onCheckout();
          }}
          disabled={items.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Bayar"
          style={({ pressed }) => [
            styles.payButton,
            { backgroundColor: items.length ? colors.primary : colors.textMuted, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <AppIcon name="kasir_bayar" size={20} />
          <Text style={styles.payLabel}>BAYAR</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { fontSize: 13, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  calcButton: { padding: 2 },
  clear: { fontSize: 12, fontWeight: '800' },
  calculator: { marginHorizontal: 10, marginBottom: 6, borderWidth: 1, borderRadius: 10, padding: 8, gap: 6 },
  calcModes: { flexDirection: 'row', gap: 6 },
  calcMode: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 6 },
  calcInput: { borderWidth: 1, borderRadius: 8, minHeight: sh(38), paddingHorizontal: 10, fontSize: 14 },
  calcTarget: { fontSize: 10 },
  calcError: { fontSize: 10, fontWeight: '700' },
  calcActions: { flexDirection: 'row', gap: 6 },
  calcApply: { flex: 1, borderWidth: 1, borderRadius: 6, alignItems: 'center', paddingVertical: 6 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 10, paddingBottom: 8, gap: 8 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 30 },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptyHint: { fontSize: 11 },
  row: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 6 },
  rowInfo: { gap: 1 },
  rowName: { fontSize: 12, fontWeight: '800' },
  rowMeta: { fontSize: 10 },
  rowSubtotal: { fontSize: 12, fontWeight: '800' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepper: { width: ms(28), height: ms(28), borderRadius: ms(28) / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 15, fontWeight: '800' },
  qtyInput: { width: 52, borderWidth: 1, borderRadius: 6, textAlign: 'center', paddingVertical: 4, fontSize: 12 },
  trash: { marginLeft: 'auto', padding: 4 },
  footer: { borderTopWidth: 1, padding: 10, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, height: sh(48) },
  payLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
