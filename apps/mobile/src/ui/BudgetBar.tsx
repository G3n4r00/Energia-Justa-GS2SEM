import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, space, type } from './tokens';

type Props = {
  used: number;
  total: number;
  style?: ViewStyle;
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

export function BudgetBar({ used, total, style }: Props) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const status = getStatus(used / (total || 1));
  const barColor = STATUS_COLOR[status];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.statusLabel, { color: barColor }]}>{STATUS_LABEL[status]}</Text>
        <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xs },
  track: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
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
  pct:         { ...type.caption, color: colors.textSecondary },
});
