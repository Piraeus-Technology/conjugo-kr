import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Fuse from 'fuse.js';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import verbs from '../data/verbs.json';
import { useColors, fonts, spacing, radius } from '../utils/theme';
import { useHistoryStore } from '../store/historyStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { romanToHangul } from '../utils/hangul';
import type { RootStackParamList } from '../types/navigation';
import type { VerbData } from '../utils/conjugate';
import { getConjugationIndex } from '../utils/conjugate';

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

/** Check if a string contains any Latin characters */
function hasLatin(str: string): boolean {
  return /[a-zA-Z]/.test(str);
}

export default function HomeScreen() {
  const colors = useColors();
  const navigation = useNavigation<NavProp>();
  const { history, loadHistory, addToHistory, removeFromHistory } = useHistoryStore();
  const { favorites, loadFavorites } = useFavoritesStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadHistory();
    loadFavorites();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim();

    // Search with original query
    const results1 = fuse.search(q);

    // If query has Latin chars, also try romanized Korean search
    let results2: typeof results1 = [];
    if (hasLatin(q)) {
      const hangulQuery = romanToHangul(q);
      if (hangulQuery !== q) {
        results2 = fuse.search(hangulQuery);
      }
    }

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged = [];
    for (const r of [...results1, ...results2]) {
      if (!seen.has(r.item.verb)) {
        seen.add(r.item.verb);
        merged.push(r);
      }
    }

    // If few results and query looks Korean, try conjugation reverse lookup
    if (merged.length < 5 && !hasLatin(q) && q.length >= 2) {
      const index = getConjugationIndex(verbs as Record<string, VerbData>);
      for (const entry of index) {
        if (entry.conjugated === q && !seen.has(entry.verb)) {
          seen.add(entry.verb);
          const sd = searchData.find(s => s.verb === entry.verb);
          if (sd) merged.push({ item: sd, refIndex: 0, score: 0.1 });
        }
      }
    }

    return merged.slice(0, 20);
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
          placeholder="Search (한글, romanized, English)..."
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
        <ScrollView style={styles.homeContent} showsVerticalScrollIndicator={false}>
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

          {/* Favorites */}
          {favorites.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                즐겨찾기 ({favorites.length})
              </Text>
              {favorites.slice(0, 5).map((verb) => {
                const data = (verbs as Record<string, VerbData>)[verb];
                if (!data) return null;
                return (
                  <TouchableOpacity
                    key={verb}
                    style={[styles.listItem, { backgroundColor: colors.card }]}
                    onPress={() => handleVerbPress(verb)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="heart" size={14} color={colors.accent} style={{ marginRight: spacing.sm }} />
                    <View style={styles.listItemLeft}>
                      <Text style={[styles.listItemVerb, { color: colors.textPrimary }]}>{verb}</Text>
                    </View>
                    <Text style={[styles.listItemTranslation, { color: colors.textSecondary }]} numberOfLines={1}>
                      {data.translation}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {favorites.length > 5 && (
                <Text style={[styles.moreText, { color: colors.textMuted }]}>
                  +{favorites.length - 5} more
                </Text>
              )}
            </View>
          )}

          {/* Recent history */}
          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>최근 검색</Text>
              {history.slice(0, 10).map((verb) => {
                const data = (verbs as Record<string, VerbData>)[verb];
                if (!data) return null;
                return (
                  <TouchableOpacity
                    key={verb}
                    style={[styles.listItem, { backgroundColor: colors.card }]}
                    onPress={() => handleVerbPress(verb)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listItemLeft}>
                      <Text style={[styles.listItemVerb, { color: colors.textPrimary }]}>{verb}</Text>
                    </View>
                    <Text style={[styles.listItemTranslation, { color: colors.textSecondary }]} numberOfLines={1}>
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

          <View style={{ height: spacing.xl }} />
        </ScrollView>
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
  homeContent: { flex: 1, paddingHorizontal: spacing.md },
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
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.semibold, marginBottom: spacing.sm },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  listItemLeft: { marginRight: spacing.md },
  listItemVerb: { fontSize: fonts.sizes.lg, fontWeight: fonts.weights.semibold },
  listItemTranslation: { flex: 1, fontSize: fonts.sizes.sm },
  moreText: { fontSize: fonts.sizes.xs, textAlign: 'center', marginTop: spacing.sm },
});
