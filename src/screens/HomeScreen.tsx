import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Fuse from 'fuse.js';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import verbs from '../data/verbs.json';
import { useColors, fonts, spacing, radius } from '../utils/theme';
import { useHistoryStore } from '../store/historyStore';
import type { RootStackParamList } from '../types/navigation';
import type { VerbData } from '../utils/conjugate';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const verbList = Object.entries(verbs as Record<string, VerbData>);

// Build search index
const searchData = verbList.map(([verb, data]) => ({
  verb,
  translation: data.translation,
  topik: data.topik,
  regular: data.regular,
}));

const fuse = new Fuse(searchData, {
  keys: [
    { name: 'verb', weight: 3 },
    { name: 'translation', weight: 1 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
});

function getVerbOfTheDay(): [string, VerbData] {
  const dayIndex = Math.floor(Date.now() / 86400000) % verbList.length;
  return verbList[dayIndex];
}

export default function HomeScreen() {
  const colors = useColors();
  const navigation = useNavigation<NavProp>();
  const { history, loadHistory, addToHistory, removeFromHistory } = useHistoryStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const results1 = fuse.search(query.trim());
    return results1.slice(0, 20);
  }, [query]);

  const handleVerbPress = useCallback((verb: string) => {
    addToHistory(verb);
    navigation.navigate('Conjugation', { verb });
  }, [navigation]);

  const [vodVerb, vodData] = getVerbOfTheDay();

  const renderVerbItem = ({ item }: { item: typeof searchData[0] }) => {
    return (
      <TouchableOpacity
        style={[styles.resultItem, { backgroundColor: colors.card }]}
        onPress={() => handleVerbPress(item.verb)}
        activeOpacity={0.7}
      >
        <View style={styles.resultLeft}>
          <Text style={[styles.resultVerb, { color: colors.textPrimary }]}>{item.verb}</Text>
        </View>
        <View style={styles.resultRight}>
          <Text style={[styles.resultTranslation, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.translation}
          </Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: item.regular ? colors.regularTag : colors.irregularTag }]}>
              <Text style={[styles.tagText, { color: item.regular ? colors.regularTagText : colors.irregularTagText }]}>
                {item.regular ? '규칙' : '불규칙'}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.tagText, { color: colors.textMuted }]}>TOPIK {item.topik}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search verbs (한글, English)..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {query.trim() ? (
        <FlatList
          data={results.map((r) => r.item)}
          keyExtractor={(item) => item.verb}
          renderItem={renderVerbItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.homeContent}>
          {/* Verb of the Day */}
          <TouchableOpacity
            style={[styles.vodCard, { backgroundColor: colors.card }]}
            onPress={() => handleVerbPress(vodVerb)}
            activeOpacity={0.7}
          >
            <Text style={[styles.vodLabel, { color: colors.textMuted }]}>오늘의 동사</Text>
            <Text style={[styles.vodVerb, { color: colors.primary }]}>{vodVerb}</Text>
            <Text style={[styles.vodTranslation, { color: colors.textPrimary }]}>{vodData.translation}</Text>
          </TouchableOpacity>

          {/* Recent history */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>최근 검색</Text>
              {history.slice(0, 10).map((verb) => {
                const data = (verbs as Record<string, VerbData>)[verb];
                if (!data) return null;
                return (
                  <TouchableOpacity
                    key={verb}
                    style={[styles.historyItem, { backgroundColor: colors.card }]}
                    onPress={() => handleVerbPress(verb)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyLeft}>
                      <Text style={[styles.historyVerb, { color: colors.textPrimary }]}>{verb}</Text>
                    </View>
                    <Text style={[styles.historyTranslation, { color: colors.textSecondary }]} numberOfLines={1}>
                      {data.translation}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFromHistory(verb)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fonts.sizes.md },
  listContent: { paddingHorizontal: spacing.md },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  resultLeft: { marginRight: spacing.md },
  resultVerb: { fontSize: fonts.sizes.xl, fontWeight: fonts.weights.bold },
  resultRight: { flex: 1, alignItems: 'flex-end' },
  resultTranslation: { fontSize: fonts.sizes.sm, marginBottom: 4 },
  tagRow: { flexDirection: 'row', gap: spacing.xs },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  tagText: { fontSize: fonts.sizes.xs, fontWeight: fonts.weights.medium },
  homeContent: { paddingHorizontal: spacing.md },
  vodCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vodLabel: { fontSize: fonts.sizes.sm, marginBottom: spacing.sm },
  vodVerb: { fontSize: fonts.sizes.hero, fontWeight: fonts.weights.bold },
  vodTranslation: { fontSize: fonts.sizes.md, marginTop: spacing.sm },
  historySection: { marginTop: spacing.lg },
  sectionTitle: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.semibold, marginBottom: spacing.sm },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  historyLeft: { marginRight: spacing.md },
  historyVerb: { fontSize: fonts.sizes.lg, fontWeight: fonts.weights.semibold },
  historyTranslation: { flex: 1, fontSize: fonts.sizes.sm },
});
