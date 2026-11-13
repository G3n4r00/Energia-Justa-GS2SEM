import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, space, type } from './tokens';

type Props = {
  used: number;
  total: number;
  style?: ViewStyle;
  dark?: boolean;
};

type Status = 'ok' | 'warning' | 'over';

function getStatus(pct: number): Status {
  if (pct >= 1) return 'over';
  if (pct >= 0.8) return 'warning';
  return 'ok';
}

const STATUS_COLOR: Record<Status, string> = {
  ok:      colors.success,
  warning: colors.warning,
  over:    colors.danger,
};

const STATUS_LABEL: Record<Status, string> = {
  ok:      'dentro do orçamento',
  warning: 'próximo do limite',
  over:    'acima do orçamento',
};

export function BudgetBar({ used, total, style, dark = false }: Props) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const status = getStatus(used / (total || 1));
  const barColor = STATUS_COLOR[status];

  const trackBg = dark ? 'rgba(255,255,255,0.15)' : colors.surfaceVariant;
  const labelColor = dark ? 'rgba(255,255,255,0.75)' : barColor;
  const pctColor = dark ? 'rgba(255,255,255,0.55)' : colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { backgroundColor: trackBg }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.statusLabel, { color: labelColor }]}>{STATUS_LABEL[status]}</Text>
        <Text style={[styles.pct, { color: pctColor }]}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xs },
  track: {
    height: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: { ...type.caption },
  pct:         { ...type.caption },
});
