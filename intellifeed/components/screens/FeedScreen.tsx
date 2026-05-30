import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../../constants/Theme';
import { detectLinkKind, ctaLabelFor } from '../../lib/externalLinks';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';
import { usePodcastPlayer } from '../../lib/PodcastPlayerContext';
import { fetchContentItems, FeedItem } from '../../lib/content';
import { saveItem, unsaveItem, getSavedSubset } from '../../lib/saved';
import { useLanguage } from '../../lib/LanguageContext';
import { fetchJoinedClubsActivity, ClubActivity } from '../../lib/clubs';
import { fetchFollowedActivity, activityVerb, FollowActivity } from '../../lib/social';
import { touchDayStreak } from '../../lib/streak';
import { getDailyQuote } from '../../lib/quotes';
import { CLUBS } from '../../constants/MockData';
import { getCategoryStyle } from '../../constants/Categories';

const CATEGORIES = ['All', 'Science', 'AI', 'Philosophy', 'Performance', 'Geopolitics', 'Business'];

const SOURCE_LABELS: Record<string, string> = {
  curated: "From the Editor's Desk",
  featured: 'Featured This Week',
  community: 'Notable in the Community',
};

function FeedCard({ item, onSave, onLike }: { item: FeedItem; onSave: () => void; onLike: () => void }) {
  const router = useRouter();
  const player = usePodcastPlayer();
  const { language, getTranslation, pending } = useLanguage();
  const translation = getTranslation(item.id);
  const isHebrew = language === 'he';
  const isTranslating = isHebrew && !translation && pending.has(item.id);
  const displayTitle = isHebrew && translation ? translation.title_he : item.title;
  const displayHook =
    isHebrew && translation
      ? (translation.hook_he ?? translation.summary_he)
      : (item.hook ?? item.summary);
  const rtlText = isHebrew && translation ? ({ writingDirection: 'rtl' as const, textAlign: 'right' as const }) : undefined;
  const isThisActive = player.isActive(item.id);
  const isThisPlaying = isThisActive && player.isPlaying;
  const isThisLoading = isThisActive && player.isLoading;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatMs = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onTogglePlay = async () => {
    if (isThisPlaying) {
      await player.pause();
    } else if (isThisActive) {
      await player.resume();
    } else {
      await player.play({
        id: item.id,
        title: item.title,
        source: item.source,
        audioUrl: item.audioUrl,
        imageUrl: item.image,
        // Used as device-TTS fallback when no audioUrl is set on the item
        ttsText: `${item.title}. ${item.summary}`,
      });
    }
  };

  // Live progress fraction (0-1) when this episode is active
  const progressFraction =
    isThisActive && player.durationMs > 0
      ? Math.min(1, player.positionMs / player.durationMs)
      : 0;

  const linkKind = detectLinkKind(item.contentUrl);

  const openArticle = () => {
    router.push({ pathname: '/article/[id]', params: { id: item.id } });
  };

  return (
    <View style={styles.card}>
      {/* Source provenance */}
      <View style={styles.sourceBadge}>
        <Text style={styles.sourceBadgeText}>
          {SOURCE_LABELS[item.contentSource] ?? "From the Editor's Desk"}
        </Text>
      </View>

      {/* Editorial content — tap to open the full article */}
      <Pressable
        onPress={openArticle}
        android_ripple={{ color: Colors.surfaceBorder }}
        style={({ pressed }) => [pressed && { opacity: 0.92 }]}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />

        {/* Category + signal */}
        <View style={styles.cardMeta}>
          {(() => {
            const s = getCategoryStyle(item.category);
            return (
              <View style={[styles.categoryPill, { borderColor: s.color + '50', backgroundColor: s.background }]}>
                <Text style={[styles.categoryGlyph, { color: s.color }]}>{s.glyph}</Text>
                <Text style={[styles.categoryText, { color: s.color }]}>{item.category}</Text>
              </View>
            );
          })()}
          <Text style={styles.timestampText}>{item.timestamp}</Text>
        </View>

        <Text style={[TextStyles.cardTitle, styles.cardTitle, rtlText]}>{displayTitle}</Text>
        {isTranslating ? (
          <View style={[styles.cardSummary, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={TextStyles.helper}>מתרגם לעברית…</Text>
          </View>
        ) : (
          <Text style={[TextStyles.bodySecondary, styles.cardSummary, rtlText]} numberOfLines={3}>
            {displayHook}
          </Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sourceRow}>
          <View style={styles.sourceAvatarBox}>
            <Text style={styles.sourceAvatar}>{item.sourceAvatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceName}>{item.source}</Text>
            <Text style={styles.readTime}>{item.readTime} min read</Text>
          </View>
          {item.contentUrl ? (
            <View style={[
              styles.readMorePill,
              linkKind === 'spotify' && styles.spotifyPill,
              linkKind === 'kindle' && styles.kindlePill,
            ]}>
              <Text style={[
                styles.readMoreText,
                linkKind === 'spotify' && styles.spotifyPillText,
                linkKind === 'kindle' && styles.kindlePillText,
              ]}>
                {ctaLabelFor(linkKind)}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <TouchableOpacity
        style={[styles.podcastPlayer, isThisActive && styles.podcastPlayerActive]}
        onPress={onTogglePlay}
        activeOpacity={0.85}
      >
        <View style={styles.playButton}>
          {isThisLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.playIcon}>{isThisPlaying ? '❚❚' : '▶'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.podcastLabel}>
            {(() => {
              const hasMP3 = !!item.audioUrl;
              if (isThisActive && isThisPlaying) return hasMP3 ? 'Now Playing' : 'Narrating';
              if (isThisActive && !isThisPlaying) return 'Paused';
              return hasMP3 ? 'Listen — Distilled Audio' : 'Listen to summary';
            })()}
          </Text>
          {item.audioUrl ? (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
            </View>
          ) : (
            <Text style={styles.podcastSubLabel}>
              {isThisActive ? 'Tap to stop' : 'AI voice · ~1 min'}
            </Text>
          )}
        </View>
        <Text style={styles.podcastDuration}>
          {isThisActive && player.durationMs > 0
            ? `${formatMs(player.positionMs)} / ${formatMs(player.durationMs)}`
            : item.podcastDuration
              ? formatDuration(item.podcastDuration)
              : ''}
        </Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Text style={[styles.actionIcon, item.isLiked && styles.actionIconActive]}>
            {item.isLiked ? '♥' : '♡'}
          </Text>
          <Text style={styles.actionCount}>{item.likes.toLocaleString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onSave}>
          <Text style={[styles.actionIcon, item.isSaved && styles.actionIconActive]}>
            {item.isSaved ? '★' : '☆'}
          </Text>
          <Text style={styles.actionCount}>{item.saves.toLocaleString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.planBtn}>
          <Text style={styles.planBtnText}>Add to Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const { language, toggle: toggleLanguage, ensureTranslations } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubActivity, setClubActivity] = useState<ClubActivity[]>([]);
  const [followActivity, setFollowActivity] = useState<FollowActivity[]>([]);
  const quote = getDailyQuote();

  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const [data, activity, social] = await Promise.all([
        fetchContentItems(),
        fetchJoinedClubsActivity(),
        fetchFollowedActivity(),
      ]);
      const savedIds = await getSavedSubset(data.map(d => d.id));
      setItems(data.map(d => ({ ...d, isSaved: savedIds.has(d.id) })));
      setClubActivity(activity);
      setFollowActivity(social);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the feed. Please try again.');
    }
  }, []);

  useEffect(() => { touchDayStreak().then(() => refreshProfile()).catch(() => {}); }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadFeed();
      setLoading(false);
    })();
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  // Translate visible items in bulk when the user switches to Hebrew.
  useEffect(() => {
    if (language !== 'he' || items.length === 0) return;
    ensureTranslations(items.map((i) => i.id));
  }, [language, items, ensureTranslations]);

  const onToggleLanguage = () => {
    toggleLanguage();
  };

  const displayName = profile?.full_name ?? user?.email ?? 'I';
  const initial = displayName.charAt(0).toUpperCase();
  const userInterests = profile?.interests ?? [];
  const hasInterests = userInterests.length > 0;

  const lowerInterests = userInterests.map(i => i.toLowerCase());

  const filteredItems = items.filter(item => {
    let matchesCategory: boolean;
    if (selectedCategory === 'All') {
      matchesCategory = hasInterests
        ? lowerInterests.some(i =>
            item.category.toLowerCase().includes(i) ||
            item.tags.some(t => t.toLowerCase().includes(i)),
          )
        : true;
    } else {
      matchesCategory = item.category === selectedCategory;
    }

    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleLike = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const handleSave = async (id: string) => {
    const current = items.find(i => i.id === id);
    if (!current) return;
    const wasSaved = current.isSaved;
    // Optimistic update
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, isSaved: !wasSaved, saves: item.saves + (wasSaved ? -1 : 1) }
          : item,
      ),
    );
    try {
      if (wasSaved) await unsaveItem(id);
      else await saveItem(id);
      // Score updated by DB trigger — pull the new value
      await refreshProfile();
    } catch {
      // Roll back optimistic update
      setItems(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, isSaved: wasSaved, saves: item.saves + (wasSaved ? 1 : -1) }
            : item,
        ),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[TextStyles.appTitle, { fontSize: 26 }]}>
            Sapience<Text style={{ color: Colors.primary }}>.</Text>
          </Text>
          <TouchableOpacity
            onPress={onToggleLanguage}
            style={[styles.langIcon, language === 'he' && styles.langIconActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.langGlyph, language === 'he' && styles.langIconTextActive]}>⇄</Text>
            <Text style={[styles.langCode, language === 'he' && styles.langIconTextActive]}>
              {language === 'he' ? 'He' : 'En'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>✱ {profile?.day_streak ?? 0}d</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => router.push('/search')}
        activeOpacity={0.85}
      >
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchPlaceholder}>
          Readers, topics, articles…
        </Text>
      </TouchableOpacity>

      <View style={styles.categoriesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.fullState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={[TextStyles.helper, { marginTop: 12 }]}>Loading the latest…</Text>
        </View>
      ) : error ? (
        <View style={styles.fullState}>
          <Text style={TextStyles.emptyTitle}>Couldn't load the feed</Text>
          <Text style={[TextStyles.emptyDescription, { textAlign: 'center', paddingHorizontal: Spacing.xl, marginTop: 8 }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={TextStyles.buttonSecondary}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: 20, marginBottom: 4 }}>
              {/* Daily quote */}
              <View style={styles.quoteCard}>
                <Text style={styles.quoteOverline}>Today · A Thought</Text>
                <Text style={styles.quoteText}>"{quote.text}"</Text>
                <Text style={styles.quoteAuthor}>— {quote.author}{quote.source ? `, ${quote.source}` : ''}</Text>
              </View>

              {/* Following activity */}
              {followActivity.length > 0 ? (
                <View style={styles.clubActivityCard}>
                  <Text style={styles.quoteOverline}>From People You Follow</Text>
                  {followActivity.slice(0, 5).map(a => {
                    const initials = (a.author_name ?? '·').trim().charAt(0).toUpperCase();
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => router.push({ pathname: '/article/[id]', params: { id: a.content_id } })}
                        style={({ pressed }) => [styles.followRow, pressed && { opacity: 0.6 }]}
                      >
                        <View style={styles.followAvatar}>
                          <Text style={styles.followAvatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.followLine} numberOfLines={1}>
                            <Text style={{ fontFamily: Fonts.sansSemibold, color: Colors.textPrimary }}>
                              {a.author_name ?? 'A reader'}
                            </Text>
                            <Text style={{ color: Colors.textMuted }}>  {activityVerb(a)}</Text>
                          </Text>
                          <Text style={styles.followTitle} numberOfLines={2}>{a.content_title}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {/* Club activity */}
              {clubActivity.length > 0 ? (
                <View style={styles.clubActivityCard}>
                  <Text style={styles.quoteOverline}>From Your Clubs</Text>
                  {clubActivity.slice(0, 4).map(a => {
                    const club = CLUBS.find(c => c.id === a.club_id);
                    return (
                      <Pressable
                        key={a.comment_id}
                        onPress={() => router.push({ pathname: '/club/[id]', params: { id: a.club_id } })}
                        style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.6 }]}
                      >
                        <Text style={styles.activityClub}>{club?.name ?? 'Club'}</Text>
                        <Text style={styles.activityBody} numberOfLines={2}>
                          <Text style={{ fontFamily: Fonts.sansSemibold, color: Colors.textPrimary }}>
                            {a.author_name ?? 'A reader'}
                          </Text>
                          {'  '}{a.body}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              onLike={() => handleLike(item.id)}
              onSave={() => handleSave(item.id)}
            />
          )}
          ListEmptyComponent={
            items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={TextStyles.emptyTitle}>The library is being curated</Text>
                <Text style={[TextStyles.emptyDescription, { textAlign: 'center', paddingHorizontal: Spacing.xl, marginTop: 8 }]}>
                  New essays, podcasts, and research will appear here shortly.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={TextStyles.emptyTitle}>No matching insights</Text>
                <Text style={[TextStyles.emptyDescription, { marginTop: 8 }]}>
                  Try a different category or query.
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  langIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.surface,
  },
  langIconActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  langGlyph: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  langCode: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.textSecondary,
  },
  langIconTextActive: { color: Colors.primary },
  headerKicker: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.primary,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchUsersBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchUsersIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  logoutIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Fonts.sansBold,
  },
  tagline: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  languageRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  languageToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  languageToggleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  languageToggleText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  languageToggleTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: Colors.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    color: Colors.textMuted,
  },
  categoriesWrap: {
    height: 48,
    marginBottom: Spacing.base,
  },
  categoryChip: {
    height: 36,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },

  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  quoteOverline: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  quoteText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  quoteAuthor: {
    marginTop: 10,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  clubActivityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  activityRow: {
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  activityClub: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.primary,
    marginBottom: 4,
  },
  activityBody: {
    fontFamily: Fonts.serifRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  followAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 0.5, borderColor: Colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  followAvatarText: {
    fontFamily: Fonts.serif, fontSize: 13,
    color: Colors.primary,
  },
  followLine: {
    fontFamily: Fonts.sans, fontSize: 12,
    lineHeight: 16,
  },
  followTitle: {
    marginTop: 3,
    fontFamily: Fonts.serif,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  friendsText: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryGlyph: {
    fontSize: 14,
    fontFamily: Fonts.serif,
    lineHeight: 16,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trendingBadge: {
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  trendingText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 1,
  },
  timestampText: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  cardTitle: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  cardSummary: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  tagsRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tagText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    gap: 12,
  },
  sourceAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sourceAvatar: {
    fontSize: 16,
    color: Colors.primary,
  },
  sourceName: {
    fontSize: 13,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  readTime: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    marginTop: 2,
  },
  readMorePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceMuted,
  },
  readMoreText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  spotifyPill: {
    backgroundColor: '#1DB95412',
    borderColor: '#1DB95440',
  },
  spotifyPillText: {
    color: '#0F8E3F',
  },
  kindlePill: {
    backgroundColor: '#C8782A14',
    borderColor: '#C8782A50',
  },
  kindlePillText: {
    color: '#A0561B',
  },
  podcastPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  podcastPlayerActive: {
    borderColor: Colors.primary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 12,
    color: Colors.background,
    fontFamily: Fonts.sansBold,
  },
  podcastLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  podcastSubLabel: {
    fontFamily: Fonts.serifItalic,
    fontSize: 11,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 1,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  podcastDuration: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionIcon: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  actionIconActive: {
    color: Colors.primary,
  },
  actionCount: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  planBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  planBtnText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  fullState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
    gap: 8,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
  },
});
