import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, space } from './tokens';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flat';
};

export function Card({ children, style, variant = 'default' }: Props) {
  return (
    <View style={[styles.base, variant === 'flat' && styles.flat, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
