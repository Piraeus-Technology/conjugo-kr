import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Fuse from 'fuse.js';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import verbs from '../data/verbs.json';
import { useColors, fonts, spacing, radius } from '../utils/theme';
import { useHistoryStore } from '../store/historyStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { romanToHangul } from '../utils/hangul';
import type { RootStackParamList } from '../types/navigation';
import { conjugateReading, FORM_LABELS, ALL_FORMS, VerbData, ConjugationForm } from '../utils/conjugate';

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

// Lazy-built conjugation index
interface ConjMatch {
  verb: string;
  translation: string;
  form: ConjugationForm;
  conjugated: string;
}

let conjugationIndex: ConjMatch[] | null = null;
let conjFuse: Fuse<ConjMatch> | null = null;

function getConjugationIndex(): ConjMatch[] {
  if (conjugationIndex) return conjugationIndex;
  conjugationIndex = [];
  verbList.forEach(([verb, data]) => {
    ALL_FORMS.forEach((form) => {
      const conjugated = conjugateReading(verb, data, form);
      conjugationIndex!.push({ verb, translation: data.translation, form, conjugated });
    });
  });
  return conjugationIndex;
}

function getConjFuse(): Fuse<ConjMatch> {
  if (conjFuse) return conjFuse;
  conjFuse = new Fuse(getConjugationIndex(), {
    keys: ['conjugated'],
    threshold: 0.2,
  });
  return conjFuse;
}

interface SearchResult {
  verb: string;
  translation: string;
  topik: string;
  regular: boolean;
  matchType: 'verb' | 'conjugation';
  matchDetail?: string;
  matchForm?: ConjugationForm;
}

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
  const { favorites, loadFavorites, toggleFavorite } = useFavoritesStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadHistory();
    loadFavorites();
  }, []);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.trim();

    // Convert romanized input to hangul
    const hangulQuery = hasLatin(q) ? romanToHangul(q) : q;

    // Check for exact conjugation matches first
    const exactConjMatches = getConjugationIndex().filter(
      (c) => c.conjugated === hangulQuery || c.conjugated === q
    );

    const seen = new Set<string>();
    const out: SearchResult[] = [];

    if (exactConjMatches.length > 0) {
      exactConjMatches.forEach((c) => {
        if (!seen.has(c.verb)) {
          seen.add(c.verb);
          const label = FORM_LABELS[c.form];
          const vData = (verbs as Record<string, VerbData>)[c.verb];
          out.push({
            verb: c.verb,
            translation: c.translation,
            topik: vData?.topik || '',
            regular: vData?.regular ?? true,
            matchType: 'conjugation',
            matchDetail: `「${c.conjugated}」— ${label.ko} (${label.en})`,
            matchForm: c.form,
          });
        }
      });
    }

    // Verb name/translation search
    const results1 = fuse.search(q);
    const results2 = hangulQuery !== q ? fuse.search(hangulQuery) : [];
    for (const r of [...results1, ...results2]) {
      if (!seen.has(r.item.verb)) {
        seen.add(r.item.verb);
        out.push({
          ...r.item,
          matchType: 'verb',
        });
      }
    }

    // Fuzzy conjugation matches (if no exact matches found)
    if (exactConjMatches.length === 0) {
      const conjResults = getConjFuse().search(hangulQuery || q);
      conjResults.forEach((r) => {
        if (!seen.has(r.item.verb)) {
          seen.add(r.item.verb);
          const label = FORM_LABELS[r.item.form];
          const vData = (verbs as Record<string, VerbData>)[r.item.verb];
          out.push({
            verb: r.item.verb,
            translation: r.item.translation,
            topik: vData?.topik || '',
            regular: vData?.regular ?? true,
            matchType: 'conjugation',
            matchDetail: `「${r.item.conjugated}」— ${label.ko} (${label.en})`,
            matchForm: r.item.form,
          });
        }
      });
    }

    return out.slice(0, 20);
  }, [query]);

  const handleVerbPress = useCallback((verb: string, highlightForm?: string) => {
    addToHistory(verb);
    navigation.navigate('Conjugation', { verb, highlightForm });
  }, [navigation]);

  const [vodVerb, vodData] = getVerbOfTheDay();

  const renderDeleteAction = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  const renderVerbItem = ({ item }: { item: SearchResult }) => {
    return (
      <TouchableOpacity
        style={[styles.resultItem, { backgroundColor: colors.card }]}
        onPress={() => handleVerbPress(item.verb, item.matchForm)}
        activeOpacity={0.7}
      >
        <View style={styles.resultLeft}>
          <Text style={[styles.resultVerb, { color: colors.textPrimary }]}>{item.verb}</Text>
        </View>
        <View style={styles.resultRight}>
          <Text style={[styles.resultTranslation, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.translation}
          </Text>
          {item.matchType === 'conjugation' && item.matchDetail && (
            <Text style={[styles.matchDetail, { color: colors.primary }]} numberOfLines={1}>
              {item.matchDetail}
            </Text>
          )}
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

  const renderSwipeableRow = (verb: string, type: 'favorite' | 'history') => {
    const data = (verbs as Record<string, VerbData>)[verb];
    if (!data) return null;

    const handleSwipeDelete = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (type === 'favorite') {
        toggleFavorite(verb);
      } else {
        removeFromHistory(verb);
      }
    };

    return (
      <Swipeable
        key={verb + type}
        renderRightActions={renderDeleteAction}
        onSwipeableOpen={handleSwipeDelete}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[styles.historyItem, { backgroundColor: colors.bg }]}
          onPress={() => handleVerbPress(verb)}
          activeOpacity={0.6}
        >
          <View style={styles.historyLeft}>
            <Text style={[styles.historyVerb, { color: colors.textPrimary }]}>{verb}</Text>
          </View>
          <Text style={[styles.historyTranslation, { color: colors.textSecondary }]} numberOfLines={1}>
            {data.translation}
          </Text>
          {type === 'favorite' ? (
            <Ionicons name="heart" size={16} color={colors.accent} style={{ marginLeft: 8 }} />
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search verbs (한글, romanized, English)..."
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
          data={results}
          keyExtractor={(item, i) => item.verb + item.matchType + i}
          renderItem={renderVerbItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching verbs</Text>
          }
        />
      ) : (
        <ScrollView style={styles.homeContent}>
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
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Favorites</Text>
              {favorites.slice(0, 10).map((verb) => renderSwipeableRow(verb, 'favorite'))}
            </View>
          )}

          {/* Recent history */}
          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent</Text>
              {history.slice(0, 10).map((verb) => renderSwipeableRow(verb, 'history'))}
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
  resultTranslation: { fontSize: fonts.sizes.sm, marginBottom: 2 },
  matchDetail: { fontSize: fonts.sizes.xs, fontStyle: 'italic', marginBottom: 4 },
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
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  historyLeft: { marginRight: spacing.md },
  historyVerb: { fontSize: fonts.sizes.lg, fontWeight: fonts.weights.semibold },
  historyTranslation: { flex: 1, fontSize: fonts.sizes.sm },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, fontSize: fonts.sizes.md },
  deleteAction: {
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
