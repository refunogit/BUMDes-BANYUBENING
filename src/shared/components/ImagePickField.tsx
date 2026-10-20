import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppIconKey } from '@/core/constants/appIcons';
import { AppIcon } from './AppIcon';
import { useTheme } from '@/store/themeStore';
import { pickImage } from '@/core/services/imageService';
import { hapticLight } from '@/core/utils/haptics';
import { ms } from '@/core/utils/scale';

type Props = {
  uri?: string | null;
  onPick: (picked: { uri: string; width: number; height: number }) => Promise<void> | void;
  size?: number;
  icon?: AppIconKey;
  label?: string;
  circular?: boolean;
  loading?: boolean;
};

/** Upload box (130 dashed emas untuk produk, 150 untuk logo). */
export function ImagePickField({
  uri,
  onPick,
  size = 150,
  icon = 'produk_upload',
  label = 'Unggah Gambar',
  circular,
  loading,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const handlePick = async () => {
    hapticLight();
    const picked = await pickImage();
    if (!picked) return;
    setBusy(true);
    try {
      await onPick(picked);
    } finally {
      setBusy(false);
    }
  };

  const dimension = ms(size);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePick}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.box,
          {
            width: dimension,
            height: dimension,
            borderRadius: circular ? dimension / 2 : 12,
            borderColor: colors.gold,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: dimension, height: dimension, borderRadius: circular ? dimension / 2 : 12 }}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <AppIcon name={icon} size={42} />
            <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={2}>
              {label}
            </Text>
          </View>
        )}
        {busy || loading ? (
          <View style={[styles.busy, { backgroundColor: colors.overlay }]}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  box: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  placeholder: { alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  hint: { fontSize: 10, textAlign: 'center' },
  busy: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
