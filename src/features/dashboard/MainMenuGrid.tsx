import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/shared/components/AppIcon';
import type { AppIconKey } from '@/core/constants/appIcons';
import { useTheme } from '@/store/themeStore';
import { hapticLight } from '@/core/utils/haptics';

export type MenuTile = { key: string; label: string; icon: AppIconKey; tint: string; onPress: () => void };

export function MainMenuGrid({ tiles }: { tiles: MenuTile[] }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          onPress={() => {
            hapticLight();
            tile.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={tile.label}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${tile.tint}18` }]}>
            <AppIcon name={tile.icon} size={26} />
          </View>
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {tile.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 64,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '800', flexShrink: 1 },
});
