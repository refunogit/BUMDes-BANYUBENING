import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppIcon } from './AppIcon';
import type { AppIconKey } from '@/core/constants/appIcons';
import { useTheme } from '@/store/themeStore';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string | null;
  prefix?: string;
  suffixIcon?: AppIconKey;
  onSuffixPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: AppIconKey;
  required?: boolean;
};

export const CustomTextField = forwardRef<TextInput, Props>(function CustomTextField(
  { label, error, hint, prefix, suffixIcon, onSuffixPress, containerStyle, leftIcon, required, style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
          },
        ]}
      >
        {leftIcon ? <AppIcon name={leftIcon} size={18} tintColor={colors.textMuted} /> : null}
        {prefix ? <Text style={[styles.prefix, { color: colors.textMuted }]}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          {...rest}
        />
        {suffixIcon ? (
          <Text onPress={onSuffixPress} accessibilityRole="button" style={styles.suffix}>
            <AppIcon name={suffixIcon} size={20} tintColor={colors.primary} />
          </Text>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  prefix: { fontSize: 15, fontWeight: '600' },
  suffix: { padding: 4 },
  error: { fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 11 },
});
