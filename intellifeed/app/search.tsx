import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../constants/Theme';
import { useAuth } from '../lib/AuthContext';
import { unifiedSearch, SearchResults } from '../lib/search';
import { getFollowedSubset } from '../lib/follows';
import { INTEREST_OPTIONS } from '../constants/Interests';

const EMPTY: SearchResults = { people: [], topics: [], articles: [] };

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setError(null);
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setFollowedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await unifiedSearch(query, user?.id);
        setResults(data);
        const followed = await getFollowedSubset(data.people.map(p => p.id));
        setFollowedIds(followed);
      } catch (e: any) {
        setError(e?.message ?? 'Search failed.');
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user?.id]);

  const hasQuery = query.trim().length >= 2;
  const noResults = hasQuery && !loading && !error
    && results.people.length === 0
    && results.topics.length === 0
    && results.articles.length === 0;

  const goToPerson = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });
  const goToArticle = (id: string) => router.push({ pathname: '/article/[id]', params: { id } });
  const useTopic = (topic: string) => setQuery(topic);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={TextStyles.buttonGhost}>← Done</Text>
        </TouchableOpacity>
        <Text style={[TextStyles.overline, { color: Colors.textPrimary }]}>Search</Text>
        <View style={{ width: 56 }} />
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Readers, topics, articles…"
          placeholderTextColor={Colors.textFaint}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <Text style={styles.clear}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Empty / discovery state */}
        {!hasQuery ? (
          <View style={styles.section}>
            <Text style={[TextStyles.overline, { marginBottom: 12 }]}>Browse topics</Text>
            <View style={styles.topicWrap}>
              {INTEREST_OPTIONS.map(t => (
                <TouchableOpacity key={t} onPress={() => useTopic(t)} style={styles.topicChip}>
                  <Text style={styles.topicText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.statusBox}>
            <Text style={TextStyles.error}>{error}</Text>
          </View>
        ) : null}

        {noResults ? (
          <View style={styles.statusBox}>
            <Text style={TextStyles.emptyTitle}>Nothing found</Text>
            <Text style={[TextStyles.emptyDescription, { textAlign: 'center', marginTop: 6 }]}>
              Try a different word, or browse a topic.
            </Text>
          </View>
        ) : null}

        {/* People */}
        {hasQuery && results.people.length > 0 ? (
          <View style={styles.section}>
            <Text style={[TextStyles.overline, { marginBottom: 8 }]}>
              People · {results.people.length}
            </Text>
            {results.people.slice(0, 5).map(p => {
              const youFollow = followedIds.has(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => goToPerson(p.id)}
                  style={styles.row}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(p.full_name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{p.full_name ?? 'Reader'}</Text>
                      {youFollow ? (
                        <View style={styles.followPill}>
                          <Text style={styles.followPillText}>Following</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                      {p.interests.length > 0 ? p.interests.slice(0, 3).join(' · ') : 'No interests yet'}
                    </Text>
                  </View>
                  <View style={styles.score}>
                    <Text style={styles.scoreNum}>{p.total_score.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Topics */}
        {hasQuery && results.topics.length > 0 ? (
          <View style={styles.section}>
            <Text style={[TextStyles.overline, { marginBottom: 8 }]}>
              Topics · {results.topics.length}
            </Text>
            <View style={styles.topicWrap}>
              {results.topics.map(t => (
                <TouchableOpacity key={t} onPress={() => useTopic(t)} style={styles.topicChipActive}>
                  <Text style={styles.topicTextActive}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Articles */}
        {hasQuery && results.articles.length > 0 ? (
          <View style={styles.section}>
            <Text style={[TextStyles.overline, { marginBottom: 8 }]}>
              Articles · {results.articles.length}
            </Text>
            {results.articles.slice(0, 10).map(a => (
              <TouchableOpacity
                key={a.id}
                onPress={() => goToArticle(a.id)}
                style={styles.articleRow}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.articleMeta}>
                    <Text style={[TextStyles.kicker, { color: a.categoryColor, fontSize: 9 }]}>
                      {a.category}
                    </Text>
                    <View style={styles.dot} />
                    <Text style={TextStyles.meta}>{a.source}</Text>
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>{a.title}</Text>
                  <Text style={TextStyles.meta}>{a.readTime} min · {a.timestamp}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.base,
    height: 50,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
    borderRadius: 999,
  },
  searchIcon: { fontSize: 18, color: Colors.textFaint },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.serifItalic,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  clear: {
    fontSize: 22,
    color: Colors.textFaint,
    paddingHorizontal: 4,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statusBox: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 4,
  },
  section: { marginBottom: Spacing.xl },

  // People
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.serif, fontSize: 16, color: Colors.surface,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: {
    fontFamily: Fonts.serif, fontSize: 16, color: Colors.textPrimary,
  },
  meta: {
    fontFamily: Fonts.serifItalic, fontSize: 12, color: Colors.textMuted, marginTop: 2,
  },
  score: { alignItems: 'flex-end' },
  scoreNum: {
    fontFamily: Fonts.serif, fontSize: 15, color: Colors.primary,
  },
  followPill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 0.5, borderColor: Colors.primary,
  },
  followPillText: {
    fontFamily: Fonts.monoMedium, fontSize: 8,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: Colors.primary,
  },

  // Topics
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.transparent,
  },
  topicText: { fontFamily: Fonts.serifRegular, fontSize: 13, color: Colors.textPrimary },
  topicChipActive: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  topicTextActive: { fontFamily: Fonts.serifRegular, fontSize: 13, color: Colors.primary },

  // Articles
  articleRow: {
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textFaint },
  articleTitle: {
    fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginVertical: 4,
  },
});
