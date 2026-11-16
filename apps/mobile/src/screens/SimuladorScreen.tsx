import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import type { Appliance, HouseholdConfig, SensorReading, Tariff } from '../types';
import { Card } from '../ui/Card';
import { colors, radius, space, type as typeTokens } from '../ui/tokens';

const FP_PADRAO = '0.92';
const TENSAO_PADRAO = '220';
const PASSO_HORAS = 0.5;

function formatarHoraISO(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatBRL(v: number) {
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

function formatHoras(h: number) {
  if (h === 0) return 'desligado';
  if (h < 1) return `${Math.round(h * 60)} min/dia`;
  return `${h.toFixed(1).replace('.', ',')} h/dia`;
}

export function SimuladorScreen() {
  const [aba, setAba] = useState<'habito' | 'sensor'>('habito');

  // — aba Hábitos —
  const [aparelhos, setAparelhos] = useState<Appliance[]>([]);
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [config, setConfig] = useState<HouseholdConfig | null>(null);
  const [selecionado, setSelecionado] = useState<Appliance | null>(null);
  const [novasHoras, setNovasHoras] = useState(0);
  const [seletorVisible, setSeletorVisible] = useState(false);
  const [carregandoHabito, setCarregandoHabito] = useState(true);
  const inicializadoRef = useRef(false);

  // — aba Sensores —
  const [tensao, setTensao] = useState(TENSAO_PADRAO);
  const [corrente, setCorrente] = useState('');
  const [fatorPotencia, setFatorPotencia] = useState(FP_PADRAO);
  const [leituras, setLeituras] = useState<SensorReading[]>([]);
  const [carregandoSensor, setCarregandoSensor] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroSensor, setErroSensor] = useState<string | null>(null);

  const potenciaSensor = useMemo(() => {
    const v = parseFloat(tensao);
    const i = parseFloat(corrente);
    const fp = parseFloat(fatorPotencia);
    if (!isNaN(v) && !isNaN(i) && !isNaN(fp) && v > 0 && i >= 0 && fp > 0 && fp <= 1) {
      return v * i * fp;
    }
    return null;
  }, [tensao, corrente, fatorPotencia]);

  const carregarHabito = useCallback(async () => {
    setCarregandoHabito(true);
    try {
      const [lista, tar, cfg] = await Promise.all([
        api.getAppliances(),
        api.getActiveTariff().catch(() => null),
        api.getConfig(),
      ]);
      setAparelhos(lista);
      setTariff(tar);
      setConfig(cfg);
      if (lista.length > 0 && !inicializadoRef.current) {
        setSelecionado(lista[0]);
        setNovasHoras(lista[0].daily_hours);
        inicializadoRef.current = true;
      }
    } catch {
      // silencioso: tela degradada é melhor que crash
    } finally {
      setCarregandoHabito(false);
    }
  }, []);

  const carregarSensor = useCallback(async () => {
    setCarregandoSensor(true);
    try {
      const data = await api.getSensorReadings(10);
      setLeituras(data);
    } catch {
      // lista vazia aceitável
    } finally {
      setCarregandoSensor(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    carregarHabito();
    carregarSensor();
  }, [carregarHabito, carregarSensor]));

  // Cálculo local — sem chamada de API
  const calculo = useMemo(() => {
    if (!selecionado || !tariff || !config) return null;
    const rate = tariff.rate_brl_kwh;
    const dias = config.cycle_days;
    const kwhAtual = selecionado.power_w / 1000 * selecionado.daily_hours * dias;
    const kwhNovo  = selecionado.power_w / 1000 * novasHoras * dias;
    return {
      custoAtual: kwhAtual * rate,
      custoNovo:  kwhNovo  * rate,
      economia:   (kwhAtual - kwhNovo) * rate,
    };
  }, [selecionado, novasHoras, tariff, config]);

  function selecionarAparelho(a: Appliance) {
    setSelecionado(a);
    setNovasHoras(a.daily_hours);
    setSeletorVisible(false);
  }

  function ajustarHoras(delta: number) {
    setNovasHoras(prev => {
      const raw = prev + delta;
      const arredondado = Math.round(raw / PASSO_HORAS) * PASSO_HORAS;
      return Math.max(0, Math.min(24, arredondado));
    });
  }

  async function registrarSensor() {
    const v = parseFloat(tensao);
    const i = parseFloat(corrente);
    const fp = parseFloat(fatorPotencia);
    if (isNaN(v) || isNaN(i) || isNaN(fp)) {
      setErroSensor('Preencha todos os campos com valores numéricos.');
      return;
    }
    setErroSensor(null);
    setEnviando(true);
    try {
      const nova = await api.createSensorReading({ voltage_rms_v: v, current_rms_a: i, power_factor: fp });
      setLeituras(prev => [nova, ...prev].slice(0, 10));
      setCorrente('');
    } catch (e) {
      setErroSensor(String(e));
    } finally {
      setEnviando(false);
    }
  }

  const horasPct = Math.min((novasHoras / 24) * 100, 100);
  const reducao = selecionado ? novasHoras < selecionado.daily_hours : false;
  const aumento = selecionado ? novasHoras > selecionado.daily_hours : false;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.tabRow}>
        {(['habito', 'sensor'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.tab, aba === t && styles.tabAtiva]}
            onPress={() => setAba(t)}
          >
            <Text style={[styles.tabLabel, aba === t && styles.tabLabelAtiva]}>
              {t === 'habito' ? 'Hábitos' : 'Sensores IoT'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── ABA HÁBITOS ─────────────────────────────── */}
      {aba === 'habito' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={carregandoHabito} onRefresh={carregarHabito} tintColor={colors.accent} />}
        >
          {carregandoHabito ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
          ) : aparelhos.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Cadastre aparelhos na aba Aparelhos para simular mudanças de hábito.
              </Text>
            </Card>
          ) : (
            <>
              {/* Seletor */}
              <Card style={styles.seletorCard}>
                <Text style={styles.fieldLabel}>Aparelho</Text>
                <Pressable style={styles.seletorBtn} onPress={() => setSeletorVisible(true)}>
                  <View style={styles.seletorInfo}>
                    <Text style={styles.seletorNome} numberOfLines={1}>
                      {selecionado?.name ?? '—'}
                    </Text>
                    {selecionado && (
                      <Text style={styles.seletorMeta}>
                        {selecionado.power_w} W · atual {formatHoras(selecionado.daily_hours)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </Pressable>
              </Card>

              {/* Stepper */}
              {selecionado && (
                <Card style={styles.stepperCard}>
                  <Text style={styles.fieldLabel}>Quanto usaria por dia?</Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={[styles.stepperBtn, novasHoras <= 0 && styles.stepperBtnOff]}
                      onPress={() => ajustarHoras(-PASSO_HORAS)}
                      disabled={novasHoras <= 0}
                    >
                      <Ionicons
                        name="remove"
                        size={24}
                        color={novasHoras <= 0 ? colors.textCaption : colors.accent}
                      />
                    </Pressable>

                    <View style={styles.stepperDisplay}>
                      <Text style={styles.stepperHoras}>{formatHoras(novasHoras)}</Text>
                      {(reducao || aumento) && (
                        <Text style={[styles.stepperDiff, reducao ? styles.diffOk : styles.diffMau]}>
                          {reducao ? '↓' : '↑'} {Math.abs(novasHoras - selecionado.daily_hours).toFixed(1).replace('.', ',')}h
                        </Text>
                      )}
                    </View>

                    <Pressable
                      style={[styles.stepperBtn, novasHoras >= 24 && styles.stepperBtnOff]}
                      onPress={() => ajustarHoras(PASSO_HORAS)}
                      disabled={novasHoras >= 24}
                    >
                      <Ionicons
                        name="add"
                        size={24}
                        color={novasHoras >= 24 ? colors.textCaption : colors.accent}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: `${horasPct}%`, backgroundColor: reducao ? colors.accent : aumento ? colors.danger : colors.textCaption }]} />
                  </View>
                  <Text style={styles.trackLegenda}>0 h{' '.repeat(12)}12 h{' '.repeat(12)}24 h</Text>
                </Card>
              )}

              {/* Resultado */}
              {calculo && selecionado && (
                <Card style={styles.resultCard}>
                  <View style={styles.comparRow}>
                    <View style={styles.comparCol}>
                      <Text style={styles.comparLabel}>Custo atual</Text>
                      <Text style={styles.comparVal}>{formatBRL(calculo.custoAtual)}</Text>
                      <Text style={styles.comparSub}>{formatHoras(selecionado.daily_hours)}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={colors.textCaption} />
                    <View style={styles.comparCol}>
                      <Text style={styles.comparLabel}>Custo proposto</Text>
                      <Text style={[
                        styles.comparVal,
                        calculo.economia > 0 && styles.comparValOk,
                        calculo.economia < 0 && styles.comparValMau,
                      ]}>
                        {formatBRL(calculo.custoNovo)}
                      </Text>
                      <Text style={styles.comparSub}>{formatHoras(novasHoras)}</Text>
                    </View>
                  </View>

                  <View style={[styles.badge, calculo.economia > 0 ? styles.badgeOk : calculo.economia < 0 ? styles.badgeMau : styles.badgeNeutro]}>
                    <Text style={[styles.badgeText, calculo.economia > 0 ? styles.badgeTextOk : calculo.economia < 0 ? styles.badgeTextMau : styles.badgeTextNeutro]}>
                      {calculo.economia > 0.005
                        ? `Economia de ${formatBRL(calculo.economia)} por ciclo`
                        : calculo.economia < -0.005
                          ? `Acréscimo de ${formatBRL(-calculo.economia)} por ciclo`
                          : 'Sem alteração no custo'}
                    </Text>
                  </View>

                  <Text style={styles.disclaimer}>
                    Estimativa para {config?.cycle_days ?? 30} dias · {tariff?.distributor} · não inclui tributos
                  </Text>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── ABA SENSORES ────────────────────────────── */}
      {aba === 'sensor' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={carregandoSensor} onRefresh={carregarSensor} tintColor={colors.accent} />}
        >
          <Card style={styles.sensorCard}>
            <Text style={styles.cardTitle}>Leitura dos sensores</Text>
            <Text style={styles.cardSub}>Sensores mock · todos os eventos têm simulated=true</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tensão (V)</Text>
                <TextInput
                  style={styles.input}
                  value={tensao}
                  onChangeText={setTensao}
                  keyboardType="decimal-pad"
                  placeholder="220"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Corrente (A)</Text>
                <TextInput
                  style={styles.input}
                  value={corrente}
                  onChangeText={setCorrente}
                  keyboardType="decimal-pad"
                  placeholder="1.2"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View>
              <Text style={styles.inputLabel}>Fator de potência</Text>
              <TextInput
                style={styles.input}
                value={fatorPotencia}
                onChangeText={setFatorPotencia}
                keyboardType="decimal-pad"
                placeholder="0.92"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.inputHint}>Típico residencial: 0.92</Text>
            </View>

            <View style={styles.sensorResult}>
              <Text style={styles.sensorResultLabel}>P = V · I · FP</Text>
              {potenciaSensor !== null ? (
                <Text style={styles.sensorResultValue}>
                  {potenciaSensor.toFixed(1).replace('.', ',')} W
                </Text>
              ) : (
                <Text style={styles.sensorResultEmpty}>— preencha os campos acima</Text>
              )}
            </View>

            {erroSensor && <Text style={styles.erroTexto}>{erroSensor}</Text>}

            <TouchableOpacity
              style={[styles.btn, (enviando || potenciaSensor === null) && styles.btnOff]}
              onPress={registrarSensor}
              disabled={enviando || potenciaSensor === null}
            >
              {enviando
                ? <ActivityIndicator size="small" color={colors.brand} />
                : <Text style={styles.btnLabel}>Registrar leitura</Text>
              }
            </TouchableOpacity>
          </Card>

          {leituras.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Leituras recentes</Text>
              <Card variant="flat">
                {leituras.map((l, idx) => (
                  <View
                    key={l.id}
                    style={[styles.leituraRow, idx === leituras.length - 1 && styles.leituraRowLast]}
                  >
                    <View>
                      <Text style={styles.leituraW}>{l.power_w.toFixed(1).replace('.', ',')} W</Text>
                      <Text style={styles.leituraDetalhe}>{l.voltage_rms_v}V · {l.current_rms_a}A · FP {l.power_factor}</Text>
                    </View>
                    <View style={styles.leituraRight}>
                      <Text style={styles.leituraHora}>{formatarHoraISO(l.created_at)}</Text>
                      <Text style={styles.simuladoBadge}>simulado</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}
        </ScrollView>
      )}

      {/* Modal seletor de aparelho */}
      <Modal
        visible={seletorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSeletorVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escolher aparelho</Text>
            <Pressable onPress={() => setSeletorVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={aparelhos}
            keyExtractor={a => String(a.id)}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.modalItem,
                  pressed && styles.modalItemPressed,
                  selecionado?.id === item.id && styles.modalItemAtivo,
                ]}
                onPress={() => selecionarAparelho(item)}
              >
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemNome}>{item.name}</Text>
                  <Text style={styles.modalItemMeta}>{item.power_w} W · {formatHoras(item.daily_hours)}</Text>
                </View>
                {selecionado?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: space.md, gap: space.md, paddingBottom: 40 },
  loader: { marginTop: space.xl },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: space.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabAtiva: { borderBottomColor: colors.accent },
  tabLabel: { ...typeTokens.label, color: colors.textSecondary },
  tabLabelAtiva: { color: colors.accent, fontWeight: '700' },

  // Seletor de aparelho
  seletorCard: { gap: space.xs },
  fieldLabel: { ...typeTokens.label, color: colors.textSecondary, marginBottom: 4 },
  seletorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    gap: space.sm,
  },
  seletorInfo: { flex: 1 },
  seletorNome: { ...typeTokens.body, color: colors.textPrimary, fontWeight: '500' },
  seletorMeta: { ...typeTokens.caption, color: colors.textSecondary, marginTop: 2 },

  // Stepper
  stepperCard: { gap: space.md },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnOff: { borderColor: colors.border },
  stepperDisplay: { flex: 1, alignItems: 'center', minWidth: 0 },
  stepperHoras: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: colors.textPrimary, textAlign: 'center' },
  stepperDiff: { ...typeTokens.label, marginTop: 2 },
  diffOk: { color: colors.success },
  diffMau: { color: colors.danger },
  track: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: { height: 6, borderRadius: 3 },
  trackLegenda: { ...typeTokens.caption, color: colors.textCaption, textAlign: 'justify' },

  // Resultado
  resultCard: { gap: space.md },
  comparRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  comparCol: { flex: 1, alignItems: 'center', gap: 2 },
  comparLabel: { ...typeTokens.caption, color: colors.textSecondary },
  comparVal: { ...typeTokens.title, color: colors.textPrimary },
  comparValOk: { color: colors.success },
  comparValMau: { color: colors.danger },
  comparSub: { ...typeTokens.caption, color: colors.textSecondary },
  badge: {
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  badgeOk: { backgroundColor: colors.successBg },
  badgeMau: { backgroundColor: colors.warningBg },
  badgeNeutro: { backgroundColor: colors.surfaceVariant },
  badgeText: { ...typeTokens.label, fontWeight: '700' },
  badgeTextOk: { color: colors.success },
  badgeTextMau: { color: colors.warning },
  badgeTextNeutro: { color: colors.textSecondary },
  disclaimer: { ...typeTokens.caption, color: colors.textCaption, textAlign: 'center' },

  // Vazio
  emptyCard: { alignItems: 'center', padding: space.lg },
  emptyText: { ...typeTokens.body, color: colors.textSecondary, textAlign: 'center' },

  // Sensores
  sensorCard: { gap: space.md },
  cardTitle: { ...typeTokens.title, color: colors.textPrimary },
  cardSub: { ...typeTokens.caption, color: colors.textSecondary, marginTop: -space.xs },
  inputRow: { flexDirection: 'row', gap: space.md },
  inputGroup: { flex: 1 },
  inputLabel: { ...typeTokens.label, color: colors.textSecondary, marginBottom: 4 },
  inputHint: { ...typeTokens.caption, color: colors.textSecondary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: space.sm,
    ...typeTokens.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  sensorResult: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    padding: space.md,
    alignItems: 'center',
    gap: 4,
  },
  sensorResultLabel: { ...typeTokens.caption, color: 'rgba(255,255,255,0.55)' },
  sensorResultValue: { fontSize: 40, fontWeight: '700', color: colors.accent, letterSpacing: -1 },
  sensorResultEmpty: { ...typeTokens.body, color: 'rgba(255,255,255,0.45)' },
  erroTexto: { ...typeTokens.caption, color: colors.danger },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  btnOff: { opacity: 0.45 },
  btnLabel: { ...typeTokens.label, color: colors.brand, fontWeight: '700' },

  sectionTitle: {
    ...typeTokens.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  leituraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  leituraRowLast: { borderBottomWidth: 0 },
  leituraW: { ...typeTokens.body, color: colors.textPrimary, fontWeight: '600' },
  leituraDetalhe: { ...typeTokens.caption, color: colors.textSecondary, marginTop: 2 },
  leituraRight: { alignItems: 'flex-end' },
  leituraHora: { ...typeTokens.caption, color: colors.textSecondary },
  simuladoBadge: { ...typeTokens.caption, color: colors.warning, fontStyle: 'italic', marginTop: 2 },

  // Modal seletor
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typeTokens.title, color: colors.textPrimary },
  modalList: { paddingBottom: 40 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalItemPressed: { backgroundColor: colors.background },
  modalItemAtivo: { backgroundColor: colors.successBg },
  modalItemInfo: { flex: 1 },
  modalItemNome: { ...typeTokens.body, color: colors.textPrimary, fontWeight: '500' },
  modalItemMeta: { ...typeTokens.caption, color: colors.textCaption, marginTop: 2 },
});
