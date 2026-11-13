import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import type { CatalogItem } from '../types';
import { colors, radius, space, type } from '../ui/tokens';

const CATEGORY_LABELS: Record<string, string> = {
  cooling:       'Climatização',
  heating:       'Aquecimento',
  entertainment: 'Entretenimento',
  appliance:     'Eletrodomésticos',
  cooking:       'Cozinha',
  electronics:   'Eletrônicos',
  lighting:      'Iluminação e Ventilação',
  other:         'Outros',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem | null) => void;
};

export function CatalogPickerModal({ visible, onClose, onSelect }: Props) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api.getCatalog()
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, [visible]);

  const sections = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const filtered = termo
      ? catalog.filter(i => i.name.toLowerCase().includes(termo))
      : catalog;

    const byCategory: Record<string, CatalogItem[]> = {};
    for (const item of filtered) {
      const cat = item.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    return Object.entries(byCategory).map(([cat, data]) => ({
      title: CATEGORY_LABELS[cat] ?? cat,
      data,
    }));
  }, [catalog, busca]);

  function handleSelect(item: CatalogItem) {
    setBusca('');
    onSelect(item);
    onClose();
  }

  function handleManual() {
    setBusca('');
    onSelect(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Escolher aparelho</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textCaption} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar aparelho..."
            placeholderTextColor={colors.textCaption}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        <Pressable style={styles.manualRow} onPress={handleManual}>
          <Ionicons name="create-outline" size={20} color={colors.accent} />
          <Text style={styles.manualText}>Cadastrar manualmente</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textCaption} />
        </Pressable>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.itemRow, pressed && styles.itemPressed]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.power_w} W · {item.typical_daily_hours}h/dia típico
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textCaption} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.semResultados}>Nenhum resultado para "{busca}".</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: { ...type.title, color: colors.textPrimary },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: space.md,
    marginBottom: 0,
    paddingHorizontal: space.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  searchIcon: { marginRight: space.xs },
  searchInput: {
    flex: 1,
    paddingVertical: space.sm + 2,
    ...type.body,
    color: colors.textPrimary,
  },

  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    margin: space.md,
    padding: space.md,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.warningBg,
  },
  manualText: { flex: 1, ...type.body, color: colors.accent, fontWeight: '600' },

  loader: { marginTop: space.xl },
  listContent: { paddingBottom: 40 },

  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { ...type.label, color: colors.textSecondary, textTransform: 'uppercase' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemPressed: { backgroundColor: colors.background },
  itemInfo: { flex: 1 },
  itemName: { ...type.body, color: colors.textPrimary, fontWeight: '500' },
  itemMeta: { ...type.caption, color: colors.textCaption, marginTop: 2 },

  semResultados: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    margin: space.xl,
  },
});
