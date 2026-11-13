import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import type { ConsumptionSummary } from '../types';
import { BudgetBar } from '../ui/BudgetBar';
import { Card } from '../ui/Card';
import { NumberDisplay } from '../ui/NumberDisplay';
import { colors, space, type } from '../ui/tokens';

export function HomeScreen() {
  const [summary, setSummary] = useState<ConsumptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await api.getConsumptionSummary();
      setSummary(data);
    } catch (e) {
      setErro(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.center}>
        <Text style={styles.erroTexto}>{erro}</Text>
      </View>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhum aparelho cadastrado</Text>
        <Text style={styles.emptyHint}>
          Adicione aparelhos na aba Aparelhos para ver o consumo estimado.
        </Text>
      </View>
    );
  }

  const top5 = summary.items.slice(0, 5);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
      }
    >
      <Card style={styles.budgetCard}>
        <NumberDisplay
          value={summary.total_brl}
          label="consumo estimado"
        />
        <View style={styles.budgetBarWrapper}>
          <BudgetBar used={summary.total_brl} total={summary.budget_brl} />
        </View>
        <Text style={styles.budgetMeta}>
          Meta: R$ {summary.budget_brl.toFixed(2).replace('.', ',')} · {summary.cycle_days} dias
        </Text>
        {summary.tariff_is_demo && (
          <Text style={styles.demoLabel}>tarifa demonstrativa · não oficial</Text>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Maiores consumidores</Text>

      <Card variant="flat">
        {top5.map((item, idx) => (
          <View
            key={item.id}
            style={[styles.itemRow, idx === top5.length - 1 && styles.itemRowLast]}
          >
            <View style={styles.itemLeft}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemKwh}>{item.kwh} kWh</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemBrl}>
                R$ {item.brl.toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.itemPct}>{item.pct_of_total}%</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.md, gap: space.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    backgroundColor: colors.background,
  },
  erroTexto: { ...type.body, color: colors.danger, textAlign: 'center' },
  emptyTitle: { ...type.title, color: colors.textPrimary, textAlign: 'center' },
  emptyHint: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
  },

  budgetCard: { alignItems: 'center', gap: space.sm },
  budgetBarWrapper: { width: '100%', marginTop: space.xs },
  budgetMeta: { ...type.caption, color: colors.textSecondary },
  demoLabel: { ...type.caption, color: colors.warning, fontStyle: 'italic' },

  sectionTitle: {
    ...type.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: space.xs,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  itemRowLast: { borderBottomWidth: 0 },
  itemLeft: { flex: 1, paddingRight: space.sm },
  itemName: { ...type.body, color: colors.textPrimary, fontWeight: '500' },
  itemKwh: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemBrl: { ...type.label, color: colors.textPrimary, fontWeight: '600' },
  itemPct: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
});
