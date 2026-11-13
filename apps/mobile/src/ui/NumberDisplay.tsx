import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, space, type } from './tokens';

type Props = {
  value: number;
  label?: string;
  showDisclaimer?: boolean;
  style?: ViewStyle;
  onDark?: boolean;
};

function formatBRL(value: number): string {
  const abs = Math.abs(value);
  const cents = Math.round(abs * 100);
  const reais = Math.floor(cents / 100);
  const centavos = String(cents % 100).padStart(2, '0');
  const reaisFormatted = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${reaisFormatted},${centavos}`;
}

export function NumberDisplay({ value, label, showDisclaimer = true, style, onDark = false }: Props) {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, onDark && styles.labelDark]}>{label}</Text>
      )}
      <Text style={[styles.value, onDark && styles.valueDark]}>{formatBRL(value)}</Text>
      {showDisclaimer && (
        <Text style={[styles.disclaimer, onDark && styles.disclaimerDark]}>
          custo estimado — não inclui tributos e bandeiras
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    ...type.label,
    color: colors.textSecondary,
    marginBottom: space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  labelDark: {
    color: 'rgba(255,255,255,0.55)',
  },
  value: {
    ...type.display,
    color: colors.textPrimary,
  },
  valueDark: {
    color: colors.textInverse,
  },
  disclaimer: {
    ...type.caption,
    color: colors.textCaption,
    marginTop: space.xs,
    textAlign: 'center',
  },
  disclaimerDark: {
    color: 'rgba(255,255,255,0.4)',
  },
});
