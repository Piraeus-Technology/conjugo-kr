import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import verbs from '../data/verbs.json';
import { useColors, fonts, spacing, radius, topikColors } from '../utils/theme';
import { useThemeStore } from '../store/themeStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { conjugate, FORM_GROUPS, VerbData } from '../utils/conjugate';
import { speak } from '../utils/speech';

export default function ConjugationScreen() {
  const colors = useColors();
  const route = useRoute<any>();
  const verb: string = route.params.verb;
  const highlightForm: string | undefined = route.params?.highlightForm;
  const verbData = (verbs as Record<string, VerbData>)[verb];
  const { isFavorite, toggleFavorite, loadFavorites } = useFavoritesStore();
  const isDark = useThemeStore((s) => s.isDark);
  const scrollRef = useRef<ScrollView>(null);
  const highlightY = useRef<number | null>(null);
  const highlightRef = useRef<View>(null);
  const scrollContentRef = useRef<View>(null);

  React.useEffect(() => {
    loadFavorites();
  }, []);

  if (!verbData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textPrimary }}>동사를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const typeLabel = verbData.regular ? '규칙' : '불규칙';

  return (
    <ScrollView ref={scrollRef} style={[styles.container, { backgroundColor: colors.bg }]}>
      <View ref={scrollContentRef}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerTop}>
          <View style={styles.verbRow}>
            <Text style={[styles.verb, { color: colors.primary }]}>{verb}</Text>
            <TouchableOpacity onPress={() => speak(verb)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="volume-medium" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(verb)}>
            <Ionicons
              name={isFavorite(verb) ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite(verb) ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.translation, { color: colors.textPrimary }]}>{verbData.translation}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.tag, { backgroundColor: verbData.regular ? colors.regularTag : colors.irregularTag }]}>
            <Text style={[styles.tagText, { color: verbData.regular ? colors.regularTagText : colors.irregularTagText }]}>
              {typeLabel}
              {verbData.irregularType ? ` (${verbData.irregularType})` : ''}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: isDark ? topikColors[verbData.topik]?.darkBg : topikColors[verbData.topik]?.bg }]}>
            <Text style={[styles.tagText, { color: isDark ? topikColors[verbData.topik]?.darkText : topikColors[verbData.topik]?.text }]}>
              TOPIK {verbData.topik}
            </Text>
          </View>
        </View>
      </View>

      {/* Conjugation Groups */}
      {FORM_GROUPS.map((group) => (
        <View key={group.title} style={styles.groupSection}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
            {group.title}
          </Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card }]}>
            {group.forms.map((form) => {
              const result = conjugate(verb, verbData, form);
              const isHighlighted = form === highlightForm && highlightForm !== 'dictionary';
              return (
                <TouchableOpacity
                  key={form}
                  ref={isHighlighted ? highlightRef as any : undefined}
                  onLayout={isHighlighted ? () => {
                    setTimeout(() => {
                      if (highlightRef.current && scrollContentRef.current) {
                        highlightRef.current.measureLayout(
                          scrollContentRef.current as any,
                          (_x, y) => {
                            scrollRef.current?.scrollTo({ y: Math.max(0, y - 150), animated: true });
                          },
                          () => {},
                        );
                      }
                    }, 400);
                  } : undefined}
                  style={[
                    styles.formRow,
                    { borderBottomColor: colors.divider },
                    isHighlighted && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => speak(result.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.formLabel}>
                    <Text style={[styles.formLabelKo, { color: colors.textMuted }]}>{result.labelKo}</Text>
                    <Text style={[styles.formLabelEn, { color: colors.textMuted }]}>{result.labelEn}</Text>
                  </View>
                  <View style={styles.formValue}>
                    <Text style={[styles.formText, { color: colors.textPrimary }]}>{result.value}</Text>
                  </View>
                  <Ionicons name="volume-medium-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Examples */}
      {verbData.examples && verbData.examples.length > 0 && (
        <View style={styles.groupSection}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>예문 (Examples)</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card }]}>
            {verbData.examples.map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.exampleRow, { borderBottomColor: colors.divider }]}
                onPress={() => speak(ex.ko)}
                activeOpacity={0.7}
              >
                <View style={styles.exampleText}>
                  <Text style={[styles.exampleKo, { color: colors.textPrimary }]}>{ex.ko}</Text>
                  <Text style={[styles.exampleEn, { color: colors.textSecondary }]}>{ex.en}</Text>
                </View>
                <Ionicons name="volume-medium-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  verbRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  verb: { fontSize: fonts.sizes.hero, fontWeight: fonts.weights.bold },
  translation: { fontSize: fonts.sizes.lg, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  tagText: { fontSize: fonts.sizes.xs, fontWeight: fonts.weights.medium },
  groupSection: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  groupTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.sm,
  },
  groupCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formLabel: { width: 110 },
  formLabelKo: { fontSize: fonts.sizes.xs, fontWeight: fonts.weights.medium },
  formLabelEn: { fontSize: 10 },
  formValue: { flex: 1 },
  formText: { fontSize: fonts.sizes.lg },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exampleText: { flex: 1 },
  exampleKo: { fontSize: fonts.sizes.md },
  exampleEn: { fontSize: fonts.sizes.sm, marginTop: 2 },
});
