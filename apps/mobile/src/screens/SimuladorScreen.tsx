import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import type { SensorReading } from '../types';
import { Card } from '../ui/Card';
import { colors, space, type as typeTokens } from '../ui/tokens';

const FP_PADRAO = '0.92';
const TENSAO_PADRAO = '220';

function formatarHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function SimuladorScreen() {
  const [tensao, setTensao] = useState(TENSAO_PADRAO);
  const [corrente, setCorrente] = useState('');
  const [fatorPotencia, setFatorPotencia] = useState(FP_PADRAO);
  const [leituras, setLeituras] = useState<SensorReading[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const potencia = useMemo(() => {
    const v = parseFloat(tensao);
    const i = parseFloat(corrente);
    const fp = parseFloat(fatorPotencia);
    if (!isNaN(v) && !isNaN(i) && !isNaN(fp) && v > 0 && i >= 0 && fp > 0 && fp <= 1) {
      return v * i * fp;
    }
    return null;
  }, [tensao, corrente, fatorPotencia]);

  const carregarLeituras = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await api.getSensorReadings(10);
      setLeituras(data);
    } catch {
      // lista vazia é aceitável no início
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarLeituras(); }, [carregarLeituras]));

  async function registrar() {
    const v = parseFloat(tensao);
    const i = parseFloat(corrente);
    const fp = parseFloat(fatorPotencia);
    if (isNaN(v) || isNaN(i) || isNaN(fp)) {
      setErro('Preencha todos os campos com valores numéricos.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const nova = await api.createSensorReading({
        voltage_rms_v: v,
        current_rms_a: i,
        power_factor: fp,
      });
      setLeituras(prev => [nova, ...prev].slice(0, 10));
      setCorrente('');
    } catch (e) {
      setErro(String(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregarLeituras} tintColor={colors.accent} />
        }
      >
        <Card style={styles.formCard}>
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

          <View style={styles.inputGroupFull}>
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

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>P = V · I · FP</Text>
            {potencia !== null ? (
              <Text style={styles.resultValue}>
                {potencia.toFixed(1).replace('.', ',')} W
              </Text>
            ) : (
              <Text style={styles.resultEmpty}>— preencha os campos acima</Text>
            )}
          </View>

          {erro && <Text style={styles.erroTexto}>{erro}</Text>}

          <TouchableOpacity
            style={[styles.btn, enviando && styles.btnDisabled]}
            onPress={registrar}
            disabled={enviando || potencia === null}
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
                  <View style={styles.leituraLeft}>
                    <Text style={styles.leituraW}>
                      {l.power_w.toFixed(1).replace('.', ',')} W
                    </Text>
                    <Text style={styles.leituraDetalhe}>
                      {l.voltage_rms_v}V · {l.current_rms_a}A · FP {l.power_factor}
                    </Text>
                  </View>
                  <View style={styles.leituraRight}>
                    <Text style={styles.leituraHora}>{formatarHora(l.created_at)}</Text>
                    <Text style={styles.simuladoBadge}>simulado</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: space.md, gap: space.md },

  formCard: { gap: space.md },
  cardTitle: { ...typeTokens.title, color: colors.textPrimary },
  cardSub: { ...typeTokens.caption, color: colors.textSecondary, marginTop: -space.xs },

  inputRow: { flexDirection: 'row', gap: space.md },
  inputGroup: { flex: 1 },
  inputGroupFull: {},
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

  resultBox: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: space.md,
    alignItems: 'center',
    gap: 4,
  },
  resultLabel: { ...typeTokens.caption, color: colors.textSecondary },
  resultValue: { fontSize: 32, fontWeight: '700', color: colors.accent, letterSpacing: -0.5 },
  resultEmpty: { ...typeTokens.body, color: colors.textSecondary },

  erroTexto: { ...typeTokens.caption, color: colors.danger },

  btn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
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
  leituraLeft: { flex: 1 },
  leituraW: { ...typeTokens.body, color: colors.textPrimary, fontWeight: '600' },
  leituraDetalhe: { ...typeTokens.caption, color: colors.textSecondary, marginTop: 2 },
  leituraRight: { alignItems: 'flex-end' },
  leituraHora: { ...typeTokens.caption, color: colors.textSecondary },
  simuladoBadge: {
    ...typeTokens.caption,
    color: colors.warning,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
