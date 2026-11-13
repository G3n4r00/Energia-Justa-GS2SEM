import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Appliance } from '../types';
import { colors, radius, space, type } from './tokens';

type Props = {
  appliance: Appliance;
  monthlyCost?: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function ApplianceRow({ appliance, monthlyCost, onEdit, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.main} onPress={onEdit}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {appliance.name}
          </Text>
          {appliance.is_protected && (
            <Ionicons name="lock-closed" size={13} color={colors.textCaption} style={styles.lock} />
          )}
        </View>
        <Text style={styles.meta}>
          {appliance.power_w} W · {appliance.daily_hours} h/dia
        </Text>
      </Pressable>

      <View style={styles.right}>
        {monthlyCost !== undefined && (
          <Text style={styles.cost}>
            R$ {monthlyCost.toFixed(2).replace('.', ',')}
          </Text>
        )}
        {!appliance.is_protected && (
          <Pressable
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  main: {
    flex: 1,
    paddingRight: space.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  name: {
    ...type.body,
    color: colors.textPrimary,
    fontWeight: '500',
    flexShrink: 1,
  },
  lock: {
    marginTop: 1,
  },
  meta: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: space.xs,
    minWidth: 80,
  },
  cost: {
    ...type.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  deleteBtn: {
    borderRadius: radius.sm,
    padding: 2,
  },
});
