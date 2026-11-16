import React, { useCallback, useRef, useState } from 'react';
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

// Arredonda para múltiplo de 5 mais próximo (metas ficam com números limpos)
function metaRedonda(valor: number, direcao: 'baixo' | 'cima'): number {
  const arred = direcao === 'baixo'
    ? Math.floor(valor / 5) * 5
    : Math.ceil(valor / 5) * 5;
  return Math.max(10, arred);
}

type Cenario = { plano: Plan; label: string; isPrincipal: boolean };

export function PlanoScreen() {
  const [metaInput, setMetaInput] = useState('');
  const [plano, setPlano] = useState<Plan | null>(null);
  const [cenarios, setCenarios] = useState<Cenario[] | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [explicando, setExplicando] = useState(false);
  const metaDefinida = useRef(false);

  const carregarUltimoPlano = useCallback(async () => {
    try {
      const [config, ultimo] = await Promise.all([
        api.getConfig(),
        api.getLastPlan(),
      ]);
      if (!metaDefinida.current) {
        setMetaInput(config.budget_brl.toFixed(2).replace('.', ','));
        metaDefinida.current = true;
      }
      if (ultimo) setPlano(ultimo);
    } catch {
      // silencioso
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarUltimoPlano(); }, [carregarUltimoPlano]));

  async function gerarPlano() {
    const meta = parseFloat(metaInput.replace(',', '.'));
    if (isNaN(meta) || meta <= 0) {
      setErro('Informe uma meta válida maior que zero.');
      return;
    }
    setErro(null);
    setGerando(true);
    setExplicacao(null);
    setCenarios(null);

    const metaBaixa = metaRedonda(meta * 0.65, 'baixo');
    const metaAlta  = metaRedonda(meta * 1.5,  'cima');

    try {
      // Cenários de comparação primeiro; plano principal por último
      // para que /plans/last continue apontando para a meta do usuário
      const [planoBaixo, planoAlto] = await Promise.all([
        api.createPlan(metaBaixa),
        api.createPlan(metaAlta),
      ]);
      const planoPrincipal = await api.createPlan(meta);

      setPlano(planoPrincipal);
      setCenarios([
        { plano: planoBaixo,    label: 'Mais esforço',  isPrincipal: false },
        { plano: planoPrincipal, label: 'Sua meta',      isPrincipal: true  },
        { plano: planoAlto,     label: 'Menos esforço', isPrincipal: false },
      ]);
    } catch (e) {
      setErro(String(e));
    } finally {
      setGerando(false);
    }
  }

  async function explicarPlano() {
    if (!plano) return;
    setExplicando(true);
    setExplicacao(null);
    try {
      const res = await api.getExplanation(plano.id);
      setExplicacao(res.explanation);
    } catch {
      setExplicacao('Não foi possível gerar a explicação no momento.');
    } finally {
      setExplicando(false);
    }
  }

  const atingiu = plano?.status === 'reached';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Formulário ─────────────────────────────── */}
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
          {/* ── Resumo ─────────────────────────────── */}
          <Card style={styles.resumoCard}>
            <View style={[styles.statusChip, atingiu ? styles.chipOk : styles.chipAlert]}>
              <Text style={[styles.statusLabel, atingiu ? styles.statusOk : styles.statusAlert]}>
                {atingiu ? 'Meta atingível' : 'Meta não atingível com os aparelhos disponíveis'}
              </Text>
            </View>
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

          {/* ── Comparação de metas ────────────────── */}
          {cenarios && (
            <>
              <Text style={styles.sectionTitle}>Comparação de metas</Text>
              <View style={styles.cenariosRow}>
                {cenarios.map((c) => {
                  const ok = c.plano.status === 'reached';
                  const falta = c.plano.projected_brl - c.plano.target_brl;
                  const nCortes = c.plano.items.length;
                  return (
                    <View
                      key={c.plano.id}
                      style={[styles.cenarioCard, c.isPrincipal && styles.cenarioCardPrincipal]}
                    >
                      <Text style={[styles.cenarioTag, c.isPrincipal && styles.cenarioTagPrincipal]}>
                        {c.label}
                      </Text>
                      <Text style={[styles.cenarioMeta, c.isPrincipal && styles.cenarioMetaPrincipal]}>
                        {formatBRL(c.plano.target_brl)}
                      </Text>

                      {ok ? (
                        <View style={styles.cenarioStatusOkPill}>
                          <Text style={styles.cenarioStatusOkText}>✓ atingível</Text>
                        </View>
                      ) : (
                        <Text style={[styles.cenarioFalta, c.isPrincipal && styles.cenarioFaltaPrincipal]}>
                          falta {formatBRL(falta)}
                        </Text>
                      )}

                      <Text style={[styles.cenarioProjetado, c.isPrincipal && styles.cenarioProjetadoPrincipal]}>
                        proj. {formatBRL(c.plano.projected_brl)}
                      </Text>

                      <Text style={[styles.cenarioCortes, c.isPrincipal && styles.cenarioCortesPrincipal]}>
                        {nCortes === 0
                          ? 'sem cortes'
                          : `${nCortes} ${nCortes === 1 ? 'sugestão' : 'sugestões'}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Sugestões ──────────────────────────── */}
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

          {/* ── IA ─────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.btnExplicar, explicando && styles.btnDisabled]}
            onPress={explicarPlano}
            disabled={explicando}
          >
            {explicando
              ? <ActivityIndicator size="small" color={colors.brand} />
              : <Text style={styles.btnExplicarLabel}>Explicar plano com IA</Text>
            }
          </TouchableOpacity>

          {explicacao && (
            <Card variant="flat" style={styles.explicacaoCard}>
              <Text style={styles.explicacaoTitle}>Explicação</Text>
              <Text style={styles.explicacaoTexto}>{explicacao}</Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.md, gap: space.md, paddingBottom: 40 },

  // Formulário
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

  // Resumo
  resumoCard: { gap: space.xs },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    marginBottom: space.xs,
  },
  chipOk: { backgroundColor: colors.successBg },
  chipAlert: { backgroundColor: colors.warningBg },
  statusLabel: { ...typeTokens.label, fontWeight: '700' },
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

  // Comparação de metas
  cenariosRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  cenarioCard: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.md,
    paddingHorizontal: space.xs + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cenarioCardPrincipal: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    // Sombra leve para destacar
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  cenarioTag: {
    ...typeTokens.caption,
    color: colors.textCaption,
    textAlign: 'center',
  },
  cenarioTagPrincipal: { color: 'rgba(255,255,255,0.55)' },
  cenarioMeta: {
    ...typeTokens.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cenarioMetaPrincipal: { color: colors.accent },

  cenarioStatusOkPill: {
    backgroundColor: colors.successBg,
    borderRadius: 999,
    paddingHorizontal: space.xs + 2,
    paddingVertical: 2,
  },
  cenarioStatusOkText: { ...typeTokens.caption, color: colors.success, fontWeight: '600' },
  cenarioFalta: {
    ...typeTokens.caption,
    color: colors.warning,
    fontWeight: '600',
    textAlign: 'center',
  },
  cenarioFaltaPrincipal: { color: '#FFBD54' },

  cenarioProjetado: {
    ...typeTokens.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cenarioProjetadoPrincipal: { color: 'rgba(255,255,255,0.6)' },
  cenarioCortes: {
    ...typeTokens.caption,
    color: colors.textCaption,
    textAlign: 'center',
  },
  cenarioCortesPrincipal: { color: 'rgba(255,255,255,0.45)' },

  // Sugestões
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

  // IA
  btnExplicar: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: space.sm,
    alignItems: 'center',
    marginTop: space.xs,
  },
  btnExplicarLabel: { ...typeTokens.label, color: colors.accent, fontWeight: '700' },

  explicacaoCard: { gap: space.xs },
  explicacaoTitle: { ...typeTokens.label, color: colors.textSecondary, fontWeight: '700' },
  explicacaoTexto: { ...typeTokens.body, color: colors.textPrimary, lineHeight: 22 },
});
