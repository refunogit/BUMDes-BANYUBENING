import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { appIcons, type AppIconKey } from '@/core/constants/appIcons';
import { ms } from '@/core/utils/scale';

type Props = {
  name: AppIconKey;
  size?: number;
  tintColor?: string;
  style?: StyleProp<ImageStyle>;
  opacity?: number;
};

/** AppIcon — every pictogram comes from assets/icon via appIcons registry. */
export function AppIcon({ name, size = 24, tintColor, style, opacity }: Props): React.ReactElement {
  return (
    <Image
      source={appIcons[name]}
      resizeMode="contain"
      style={[{ width: ms(size), height: ms(size), opacity }, tintColor ? { tintColor } : null, style]}
      accessibilityIgnoresInvertColors
    />
  );
}
