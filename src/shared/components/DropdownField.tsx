/**
 * DropdownField — sama untuk Satuan, Kategori Produk, dan Kategori Beban:
 * tombol 70% + lingkaran 44 "+" + label "Tambah X". Modal picker dengan
 * pencarian + input tambah baru (duplikat-safe di repository).
 */
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/store/themeStore';
import { hapticLight } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  onAddNew: (value: string) => Promise<void> | void;
  addLabel: string;
  modalTitle: string;
  error?: string | null;
  required?: boolean;
};

export function DropdownField({
  label,
  value,
  options,
  onSelect,
  onAddNew,
  addLabel,
  modalTitle,
  error,
  required,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(search.trim().toLowerCase())),
    [options, search],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            hapticLight();
            setOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[styles.field, { backgroundColor: colors.inputBg, borderColor: error ? colors.danger : colors.border }]}
        >
          <Text style={[styles.value, { color: value ? colors.text : colors.textMuted }]} numberOfLines={1}>
            {value || 'Pilih'}
          </Text>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>▾</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            setOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          style={[styles.plus, { borderColor: colors.gold, width: ms(44), height: ms(44), borderRadius: ms(44) / 2 }]}
        >
          <Text style={[styles.plusText, { color: colors.gold }]}>+</Text>
        </Pressable>
        <Text style={[styles.addLabel, { color: colors.textMuted }]} numberOfLines={2}>
          {addLabel}
        </Text>
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{modalTitle}</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button">
                <Text style={[styles.close, { color: colors.textMuted }]}>Tutup</Text>
              </Pressable>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari..."
              placeholderTextColor={colors.textMuted}
              style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            />
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {filtered.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={[styles.option, { borderBottomColor: colors.border }, option === value && { backgroundColor: colors.chipBg }]}
                >
                  <Text style={[styles.optionText, { color: colors.text, fontWeight: option === value ? '800' : '500' }]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
              {filtered.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>Tidak ada pilihan.</Text> : null}
            </ScrollView>
            <View style={[styles.addRow, { borderTopColor: colors.border }]}>
              <TextInput
                value={newValue}
                onChangeText={setNewValue}
                placeholder={addLabel}
                placeholderTextColor={colors.textMuted}
                style={[styles.newInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
              />
              <PrimaryButton
                label="Tambah"
                height={44}
                loading={adding}
                onPress={async () => {
                  const clean = newValue.trim();
                  if (!clean) return;
                  setAdding(true);
                  await onAddNew(clean);
                  onSelect(clean);
                  setNewValue('');
                  setSearch('');
                  setAdding(false);
                  setOpen(false);
                }}
                style={styles.addButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    width: '70%',
    gap: 8,
  },
  value: { fontSize: 14, flexShrink: 1 },
  chevron: { fontSize: 14 },
  plus: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 22, fontWeight: '700', lineHeight: 24 },
  addLabel: { flex: 1, fontSize: 11, lineHeight: 14 },
  error: { fontSize: 12, fontWeight: '600' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '85%', gap: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '800' },
  close: { fontSize: 13, fontWeight: '700' },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 42 },
  list: { maxHeight: 320 },
  option: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 14 },
  empty: { paddingVertical: 16, fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, alignItems: 'center' },
  newInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 44 },
  addButton: { paddingHorizontal: 18, minWidth: 96 },
});
