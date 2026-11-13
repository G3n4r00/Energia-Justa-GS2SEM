import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import type { Plan } from '../types';
import { Card } from '../ui/Card';
import { colors, space, type as typeTokens } from '../ui/tokens';

function formatBRL(v: number) {
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

function formatHoras(h: number) {
  if (h === 0) return 'desligar';
  if (h < 1) return `${Math.round(h * 60)} min/dia`;
  return `${h.toFixed(1).replace('.', ',')}h/dia`;
}

export function PlanoScreen() {
  const [metaInput, setMetaInput] = useState('');
  const [plano, setPlano] = useState<Plan | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarUltimoPlano = useCallback(async () => {
    try {
      const [config, ultimo] = await Promise.all([
        api.getConfig(),
        api.getLastPlan(),
      ]);
      if (metaInput === '') {
        setMetaInput(config.budget_brl.toFixed(2).replace('.', ','));
      }
      if (ultimo) setPlano(ultimo);
    } catch {
      // silencioso: tela pode funcionar sem dados anteriores
    }
  }, [metaInput]);

  useFocusEffect(useCallback(() => { carregarUltimoPlano(); }, [carregarUltimoPlano]));

  async function gerarPlano() {
    const meta = parseFloat(metaInput.replace(',', '.'));
    if (isNaN(meta) || meta <= 0) {
      setErro('Informe uma meta válida maior que zero.');
      return;
    }
    setErro(null);
    setGerando(true);
    try {
      const p = await api.createPlan(meta);
      setPlano(p);
    } catch (e) {
      setErro(String(e));
    } finally {
      setGerando(false);
    }
  }

  const atingiu = plano?.status === 'reached';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Card style={styles.formCard}>
        <Text style={styles.formLabel}>Meta de orçamento (R$)</Text>
        <View style={styles.formRow}>
          <TextInput
            style={styles.input}
            value={metaInput}
            onChangeText={setMetaInput}
            keyboardType="decimal-pad"
            placeholder="200,00"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.btn, gerando && styles.btnDisabled]}
            onPress={gerarPlano}
            disabled={gerando}
          >
            {gerando
              ? <ActivityIndicator size="small" color={colors.brand} />
              : <Text style={styles.btnLabel}>Gerar plano</Text>
            }
          </TouchableOpacity>
        </View>
        {erro && <Text style={styles.erroTexto}>{erro}</Text>}
      </Card>

      {plano && (
        <>
          <Card style={[styles.resumoCard, atingiu ? styles.resumoOk : styles.resumoAlert]}>
            <Text style={[styles.statusLabel, atingiu ? styles.statusOk : styles.statusAlert]}>
              {atingiu ? 'Meta atingível' : 'Meta não atingível com os aparelhos disponíveis'}
            </Text>
            <View style={styles.resumoRow}>
              <Text style={styles.resumoKey}>Consumo atual</Text>
              <Text style={styles.resumoVal}>{formatBRL(plano.current_brl)}</Text>
            </View>
            <View style={styles.resumoRow}>
              <Text style={styles.resumoKey}>Projetado</Text>
              <Text style={[styles.resumoVal, atingiu && styles.resumoValOk]}>
                {formatBRL(plano.projected_brl)}
              </Text>
            </View>
            <View style={styles.resumoRow}>
              <Text style={styles.resumoKey}>Economia estimada</Text>
              <Text style={styles.resumoValSaving}>{formatBRL(plano.savings_brl)}</Text>
            </View>
          </Card>

          {plano.items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Sugestões</Text>
              <Card variant="flat">
                {plano.items.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      idx === plano.items.length - 1 && styles.itemRowLast,
                    ]}
                  >
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.appliance_name}
                      </Text>
                      <Text style={styles.itemHoras}>
                        {formatHoras(item.current_daily_hours)}
                        {' → '}
                        <Text style={styles.itemHorasSugerido}>
                          {formatHoras(item.suggested_daily_hours)}
                        </Text>
                      </Text>
                    </View>
                    <Text style={styles.itemSaving}>
                      -{formatBRL(item.saving_brl)}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {plano.items.length === 0 && atingiu && (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Consumo já está dentro da meta. Nenhuma alteração necessária.
              </Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.md, gap: space.md },

  formCard: { gap: space.sm },
  formLabel: { ...typeTokens.label, color: colors.textSecondary },
  formRow: { flexDirection: 'row', gap: space.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: space.sm,
    ...typeTokens.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    minWidth: 110,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { ...typeTokens.label, color: colors.brand, fontWeight: '700' },
  erroTexto: { ...typeTokens.caption, color: colors.danger },

  resumoCard: { gap: space.xs },
  resumoOk: { borderLeftWidth: 3, borderLeftColor: colors.success },
  resumoAlert: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  statusLabel: { ...typeTokens.label, fontWeight: '700', marginBottom: space.xs },
  statusOk: { color: colors.success },
  statusAlert: { color: colors.warning },
  resumoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  resumoKey: { ...typeTokens.body, color: colors.textSecondary },
  resumoVal: { ...typeTokens.body, color: colors.textPrimary, fontWeight: '600' },
  resumoValOk: { color: colors.success },
  resumoValSaving: { ...typeTokens.body, color: colors.accent, fontWeight: '700' },

  sectionTitle: {
    ...typeTokens.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  itemName: { ...typeTokens.body, color: colors.textPrimary, fontWeight: '500' },
  itemHoras: { ...typeTokens.caption, color: colors.textSecondary, marginTop: 2 },
  itemHorasSugerido: { color: colors.accent, fontWeight: '600' },
  itemSaving: { ...typeTokens.label, color: colors.success, fontWeight: '700' },

  emptyCard: { alignItems: 'center', padding: space.lg },
  emptyText: { ...typeTokens.body, color: colors.textSecondary, textAlign: 'center' },
});
