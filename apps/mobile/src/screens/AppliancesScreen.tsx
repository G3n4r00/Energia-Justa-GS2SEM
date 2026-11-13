import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import type { Appliance, AppliancePayload, CatalogItem } from '../types';
import { ApplianceRow } from '../ui/ApplianceRow';
import { Button } from '../ui/Button';
import { colors, radius, space, type } from '../ui/tokens';
import { CatalogPickerModal } from './CatalogPickerModal';

type FormState = {
  name: string;
  power_w: string;
  daily_hours: string;
  is_protected: boolean;
};

const FORM_EMPTY: FormState = {
  name: '',
  power_w: '',
  daily_hours: '',
  is_protected: false,
};

function toPayload(f: FormState): AppliancePayload | null {
  const power = parseFloat(f.power_w.replace(',', '.'));
  const hours = parseFloat(f.daily_hours.replace(',', '.'));
  if (!f.name.trim() || isNaN(power) || power <= 0 || isNaN(hours) || hours < 0 || hours > 24) {
    return null;
  }
  return { name: f.name.trim(), power_w: power, daily_hours: hours, is_protected: f.is_protected };
}

export function AppliancesScreen() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [consumptionMap, setConsumptionMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [catalogVisible, setCatalogVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Appliance | null>(null);
  const [form, setForm] = useState<FormState>(FORM_EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [list, summary] = await Promise.all([
        api.getAppliances(),
        api.getConsumptionSummary().catch(() => null),
      ]);
      setAppliances(list);
      if (summary) {
        const map: Record<number, number> = {};
        summary.items.forEach(i => { map[i.id] = i.brl; });
        setConsumptionMap(map);
      }
    } catch (e) {
      setErro(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openCreate() {
    setEditing(null);
    setForm(FORM_EMPTY);
    setCatalogVisible(true);
  }

  function handleCatalogSelect(item: CatalogItem | null) {
    if (item) {
      setForm({
        name: item.name,
        power_w: String(item.power_w),
        daily_hours: String(item.typical_daily_hours),
        is_protected: item.is_protected_default,
      });
    } else {
      setForm(FORM_EMPTY);
    }
    setModalVisible(true);
  }

  function openEdit(a: Appliance) {
    setEditing(a);
    setForm({
      name: a.name,
      power_w: String(a.power_w),
      daily_hours: String(a.daily_hours),
      is_protected: a.is_protected,
    });
    setModalVisible(true);
  }

  async function handleSave() {
    const payload = toPayload(form);
    if (!payload) {
      Alert.alert('Dados inválidos', 'Verifique nome, potência (W > 0) e horas (0–24).');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.updateAppliance(editing.id, payload);
      } else {
        await api.createAppliance(payload);
      }
      setModalVisible(false);
      await load();
    } catch (e) {
      Alert.alert('Erro', String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(a: Appliance) {
    Alert.alert(
      'Remover aparelho',
      `Remover "${a.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAppliance(a.id);
              await load();
            } catch (e) {
              Alert.alert('Erro', String(e));
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {!loading && erro && (
        <View style={styles.center}>
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}

      {!loading && !erro && (
        <FlatList
          data={appliances}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Nenhum aparelho ainda</Text>
              <Text style={styles.emptyHint}>Toque em + para adicionar o primeiro.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ApplianceRow
              appliance={item}
              monthlyCost={consumptionMap[item.id]}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <CatalogPickerModal
        visible={catalogVisible}
        onClose={() => setCatalogVisible(false)}
        onSelect={handleCatalogSelect}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editing ? 'Editar aparelho' : 'Confirmar aparelho'}
            </Text>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="ex: Ar-condicionado"
              placeholderTextColor={colors.textCaption}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Potência (W)</Text>
            <TextInput
              style={styles.input}
              value={form.power_w}
              onChangeText={v => setForm(f => ({ ...f, power_w: v }))}
              placeholder="ex: 900"
              placeholderTextColor={colors.textCaption}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Horas de uso por dia</Text>
            <TextInput
              style={styles.input}
              value={form.daily_hours}
              onChangeText={v => setForm(f => ({ ...f, daily_hours: v }))}
              placeholder="ex: 8"
              placeholderTextColor={colors.textCaption}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.fieldLabel}>Aparelho essencial</Text>
                <Text style={styles.switchHint}>
                  O recomendador não sugere reduzir este aparelho.
                </Text>
              </View>
              <Switch
                value={form.is_protected}
                onValueChange={v => setForm(f => ({ ...f, is_protected: v }))}
                trackColor={{ true: colors.accent, false: colors.surfaceVariant }}
                thumbColor={colors.surface}
              />
            </View>

            <Button
              label={editing ? 'Salvar alterações' : 'Adicionar aparelho'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: space.md, paddingBottom: 96 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  erroTexto: { ...type.body, color: colors.danger, textAlign: 'center' },
  emptyTitle: { ...type.title, color: colors.textPrimary, textAlign: 'center' },
  emptyHint: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
  },

  fab: {
    position: 'absolute',
    bottom: space.xl,
    right: space.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...type.title, color: colors.textPrimary },

  formContent: { padding: space.md, gap: space.sm },
  fieldLabel: { ...type.label, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
  },
  switchLabel: { flex: 1 },
  switchHint: { ...type.caption, color: colors.textCaption, marginTop: 2 },
  saveBtn: { marginTop: space.md },
});
