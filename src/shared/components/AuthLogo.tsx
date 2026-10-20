import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { useTheme } from '@/store/themeStore';
import { getSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { fileExists } from '@/core/services/storageService';
import { ms } from '@/core/utils/scale';

/** Satu logo aplikasi (bumdes_logo) — fallback ke ikon storefront. */
export function AuthLogo({ size = 110 }: { size?: number }): React.ReactElement {
  const { colors } = useTheme();
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const saved = await getSetting(SETTINGS_KEYS.bumdesLogo);
      if (mounted && fileExists(saved)) setUri(saved);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const dimension = ms(size);
  return (
    <View
      style={[
        styles.ring,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderColor: colors.gold,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: dimension - 8, height: dimension - 8, borderRadius: (dimension - 8) / 2 }} />
      ) : (
        <AppIcon name="login_gembok" size={size * 0.55} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
