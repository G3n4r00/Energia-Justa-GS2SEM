import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, space, type } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textInverse : colors.accent}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    ...type.label,
    fontWeight: '600',
  },

  primary:        { backgroundColor: colors.accent },
  primaryPressed: { backgroundColor: colors.accentDark },
  primaryLabel:   { color: colors.textInverse },

  secondary:        { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent },
  secondaryPressed: { backgroundColor: colors.warningBg },
  secondaryLabel:   { color: colors.accent },

  ghost:        { backgroundColor: 'transparent' },
  ghostPressed: { backgroundColor: colors.surfaceVariant },
  ghostLabel:   { color: colors.textSecondary },

  disabled: { opacity: 0.45 },
});
