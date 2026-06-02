import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ImageBackground,
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
import { generateBriefing, type Briefing } from '../../lib/briefing';
import { narrateItem } from '../../lib/narrate';

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
  const [narrating, setNarrating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(item.audioUrl ?? null);
  const isThisLoading = (isThisActive && player.isLoading) || narrating;

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
      return;
    }
    if (isThisActive) {
      await player.resume();
      return;
    }
    // No MP3 yet → generate a high-quality OpenAI TTS narration on demand
    // (cached server-side, so this only happens the first time per article).
    let url = audioUrl;
    if (!url) {
      setNarrating(true);
      try {
        url = await narrateItem(item.id);
        setAudioUrl(url);
      } catch {
        // Fall back to on-device narration below.
      } finally {
        setNarrating(false);
      }
    }
    await player.play({
      id: item.id,
      title: item.title,
      source: item.source,
      audioUrl: url,
      imageUrl: item.image,
      ttsText: `${item.title}. ${item.summary}`,
    });
  };

  const progressFraction =
    isThisActive && player.durationMs > 0
      ? Math.min(1, player.positionMs / player.durationMs)
      : 0;

  const linkKind = detectLinkKind(item.contentUrl);

  const openArticle = () => {
    router.push({ pathname: '/article/[id]', params: { id: item.id } });
  };

  const categoryStyle = getCategoryStyle(item.category);

  return (
    <View style={styles.card}>
      {/* Hero — image or gradient, with text overlay */}
      <Pressable
        onPress={openArticle}
        android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
        style={({ pressed }) => [pressed && { opacity: 0.93 }]}
      >
        {item.image ? (
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.cardHeroBg}
            resizeMode="cover"
          >
            {/* subtle tint on top portion */}
            <View style={[styles.cardScrimTop, { backgroundColor: categoryStyle.gradientEnd + '30' }]} />
            {/* strong dark scrim on bottom — ensures text is always readable */}
            <View style={[styles.cardScrimBottom, { backgroundColor: categoryStyle.gradientStart + 'F0' }]} />
            <View style={styles.cardOverlay}>
              <View style={styles.cardOverlayTop}>
                <View style={styles.categoryPillOverlay}>
                  <Text style={styles.categoryGlyphOverlay}>{categoryStyle.glyph}</Text>
                  <Text style={styles.categoryTextOverlay}>{item.category}</Text>
                </View>
                <Text style={styles.timestampOverlay}>{item.timestamp}</Text>
              </View>
              <Text style={[styles.cardTitle, rtlText]} numberOfLines={3}>{displayTitle}</Text>
              {isTranslating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                  <Text style={styles.cardHookOverlay}>מתרגם…</Text>
                </View>
              ) : (
                <Text style={[styles.cardHookOverlay, rtlText]} numberOfLines={2}>{displayHook}</Text>
              )}
              <Text style={styles.sourceOverlay}>{item.source} · {item.readTime} min read</Text>
            </View>
          </ImageBackground>
        ) : (
          // No image — solid gradient fallback
          <View style={[styles.cardHeroBg, { backgroundColor: categoryStyle.gradientStart }]}>
            <View style={[styles.cardScrimBottom, { backgroundColor: categoryStyle.gradientEnd + 'BB' }]} />
            <View style={styles.cardOverlay}>
              <View style={styles.cardOverlayTop}>
                <View style={styles.categoryPillOverlay}>
                  <Text style={styles.categoryGlyphOverlay}>{categoryStyle.glyph}</Text>
                  <Text style={styles.categoryTextOverlay}>{item.category}</Text>
                </View>
                <Text style={styles.timestampOverlay}>{item.timestamp}</Text>
              </View>
              <Text style={[styles.cardTitle, rtlText]} numberOfLines={3}>{displayTitle}</Text>
              {isTranslating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                  <Text style={styles.cardHookOverlay}>מתרגם…</Text>
                </View>
              ) : (
                <Text style={[styles.cardHookOverlay, rtlText]} numberOfLines={2}>{displayHook}</Text>
              )}
              <Text style={styles.sourceOverlay}>{item.source} · {item.readTime} min read</Text>
            </View>
          </View>
        )}
      </Pressable>

      {/* Audio player — slim strip */}
      <TouchableOpacity
        style={[styles.audioStrip, isThisActive && styles.audioStripActive]}
        onPress={onTogglePlay}
        activeOpacity={0.85}
      >
        <View style={[styles.playBtn, isThisActive && styles.playBtnActive]}>
          {isThisLoading ? (
            <ActivityIndicator size="small" color={isThisActive ? Colors.white : Colors.primary} />
          ) : (
            <Text style={[styles.playIcon, isThisActive && styles.playIconActive]}>
              {isThisPlaying ? '❚❚' : '▶'}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          {audioUrl && isThisActive ? (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
            </View>
          ) : (
            <Text style={styles.audioLabel}>
              {narrating ? 'Generating audio…' : isThisPlaying ? 'Now playing' : isThisActive ? 'Paused' : 'Listen · AI narration'}
            </Text>
          )}
        </View>

        <Text style={styles.audioDuration}>
          {isThisActive && player.durationMs > 0
            ? `${formatMs(player.positionMs)} / ${formatMs(player.durationMs)}`
            : item.podcastDuration ? formatDuration(item.podcastDuration) : ''}
        </Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Text style={[styles.actionIcon, item.isLiked && styles.actionIconActive]}>
            {item.isLiked ? '♥' : '♡'}
          </Text>
          <Text style={[styles.actionCount, item.isLiked && styles.actionCountActive]}>
            {item.likes.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onSave}>
          <Text style={[styles.actionIcon, item.isSaved && styles.actionIconActive]}>
            {item.isSaved ? '★' : '☆'}
          </Text>
          <Text style={[styles.actionCount, item.isSaved && styles.actionCountActive]}>
            {item.saves.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.planBtn}>
          <Text style={styles.planBtnText}>+ Plan</Text>
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
  const [briefingBusy, setBriefingBusy] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<(Briefing & { trackId: string }) | null>(null);
  const [showScript, setShowScript] = useState(false);
  const quote = getDailyQuote();
  const player = usePodcastPlayer();

  const briefingActive = !!briefing && player.isActive(briefing.trackId);
  const briefingPlaying = briefingActive && player.isPlaying;

  const onGenerateBriefing = async () => {
    if (briefingBusy) return;
    // Already have a briefing for this session — toggle play/pause instead of regenerating
    if (briefingActive) {
      if (briefingPlaying) await player.pause();
      else await player.resume();
      return;
    }
    const top3 = items.slice(0, 3);
    if (top3.length < 1) return;
    setBriefingBusy(true);
    setBriefingError(null);
    try {
      const b = await generateBriefing(top3.map(i => i.id));
      const trackId = `briefing-${Date.now()}`;
      setBriefing({ ...b, trackId });
      setShowScript(true);
      await player.play({
        id: trackId,
        title: b.title,
        source: 'Sapience',
        audioUrl: b.audio_url,
        // Fallback: if the MP3 can't be loaded (e.g. on web), narrate the script
        // with on-device TTS so the briefing still plays.
        ttsText: b.script,
      });
    } catch (e: any) {
      setBriefingError(e?.message ?? 'Could not generate the briefing.');
    } finally {
      setBriefingBusy(false);
    }
  };

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
        <Text style={TextStyles.appTitle}>
          Sapience<Text style={{ color: Colors.primary }}>.</Text>
        </Text>
        <View style={styles.headerRight}>
          {(profile?.day_streak ?? 0) > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>✱ {profile?.day_streak}</Text>
            </View>
          )}
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
            <Text style={[TextStyles.buttonSecondary, { color: Colors.white }]}>Try Again</Text>
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
            <View style={{ gap: 16, marginBottom: 4 }}>
              {/* Briefing strip */}
              {items.length >= 1 ? (
                <View>
                  <TouchableOpacity
                    onPress={onGenerateBriefing}
                    disabled={briefingBusy}
                    activeOpacity={0.85}
                    style={[styles.briefingStrip, briefingBusy && { opacity: 0.7 }]}
                  >
                    <View style={styles.briefingPlayBtn}>
                      {briefingBusy
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Text style={styles.briefingPlayIcon}>{briefingPlaying ? '❚❚' : '▶'}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.briefingStripTitle} numberOfLines={1}>
                        {briefingActive ? briefing!.title : "Today's Briefing"}
                      </Text>
                      <Text style={styles.briefingStripSub}>
                        {briefingBusy
                          ? 'Preparing your briefing…'
                          : briefingActive
                            ? (briefingPlaying ? 'Now playing · tap to pause' : 'Paused · tap to resume')
                            : 'Three pieces · narrated'}
                      </Text>
                    </View>
                    {briefing ? (
                      <TouchableOpacity
                        onPress={() => setShowScript(s => !s)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Text style={styles.briefingStripArrow}>{showScript ? '⌄' : '›'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.briefingStripArrow}>›</Text>
                    )}
                  </TouchableOpacity>
                  {briefing && showScript ? (
                    <View style={styles.briefingScriptCard}>
                      <Text style={styles.briefingScriptText}>{briefing.script}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {briefingError ? (
                <Text style={[TextStyles.error, { marginTop: -8 }]}>{briefingError}</Text>
              ) : null}

              {/* Daily quote — compact */}
              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>"{quote.text}"</Text>
                <Text style={styles.quoteAuthor}>— {quote.author}{quote.source ? `, ${quote.source}` : ''}</Text>
              </View>

              {/* Following activity */}
              {followActivity.length > 0 ? (
                <View style={styles.activityCard}>
                  <Text style={styles.activityCardLabel}>From People You Follow</Text>
                  {followActivity.slice(0, 4).map(a => {
                    const initials = (a.author_name ?? '·').trim().charAt(0).toUpperCase();
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => router.push({ pathname: '/article/[id]', params: { id: a.content_id } })}
                        style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.6 }]}
                      >
                        <View style={styles.followAvatar}>
                          <Text style={styles.followAvatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.followLine} numberOfLines={1}>
                            <Text style={{ fontFamily: Fonts.sansSemibold, color: Colors.textPrimary }}>
                              {a.author_name ?? 'A reader'}
                            </Text>
                            {'  '}
                            <Text style={{ color: Colors.textMuted }}>{activityVerb(a)}</Text>
                          </Text>
                          <Text style={styles.followTitle} numberOfLines={1}>{a.content_title}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {/* Club activity */}
              {clubActivity.length > 0 ? (
                <View style={styles.activityCard}>
                  <Text style={styles.activityCardLabel}>From Your Clubs</Text>
                  {clubActivity.slice(0, 3).map(a => {
                    const club = CLUBS.find(c => c.id === a.club_id);
                    return (
                      <Pressable
                        key={a.comment_id}
                        onPress={() => router.push({ pathname: '/club/[id]', params: { id: a.club_id } })}
                        style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.6 }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.clubLabel}>{club?.name ?? 'Club'}</Text>
                          <Text style={styles.activityBody} numberOfLines={2}>
                            <Text style={{ fontFamily: Fonts.sansSemibold, color: Colors.textPrimary }}>
                              {a.author_name ?? 'A reader'}
                            </Text>
                            {'  '}{a.body}
                          </Text>
                        </View>
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
  // ─── Shell ───────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDeep, // very light gray — cards float on it
  },

  // ─── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  streakText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  langIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.background,
  },
  langIconActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  langGlyph: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 13,
  },
  langCode: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: Colors.textSecondary,
  },
  langIconTextActive: { color: Colors.primary },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: Colors.white,
  },

  // ─── Search ──────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.textFaint,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textFaint,
  },

  // ─── Category chips ───────────────────────────────────────────────────────
  categoriesWrap: {
    height: 44,
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    height: 32,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderStrong,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.sansSemibold,
  },

  // ─── Briefing strip ───────────────────────────────────────────────────────
  briefingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  briefingPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingPlayIcon: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: Fonts.sansBold,
  },
  briefingStripTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  briefingStripSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  briefingStripArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 24,
  },
  briefingScriptCard: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  briefingScriptText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },

  // ─── Quote ───────────────────────────────────────────────────────────────
  quoteCard: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    gap: 4,
  },
  quoteText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  quoteAuthor: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textFaint,
  },

  // ─── Activity cards ───────────────────────────────────────────────────────
  activityCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  activityCardLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  clubLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.primary,
    marginBottom: 3,
  },
  activityBody: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  followAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  followAvatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.primary,
  },
  followLine: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  followTitle: {
    marginTop: 2,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textPrimary,
  },

  // ─── Feed Card ───────────────────────────────────────────────────────────
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  // Hero image / gradient area
  cardHeroBg: {
    width: '100%',
    height: 185,
    justifyContent: 'flex-end',
  },
  // top portion — very light tint, image visible
  cardScrimTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '45%',
  },
  // bottom portion — opaque enough for white text to be readable
  cardScrimBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '72%',
  },
  cardOverlay: {
    padding: Spacing.base,
    gap: 5,
  },
  cardOverlayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryPillOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryGlyphOverlay: {
    fontSize: 11,
    color: '#fff',
  },
  categoryTextOverlay: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: '#fff',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  timestampOverlay: {
    fontSize: 10,
    fontFamily: Fonts.sans,
    color: 'rgba(255,255,255,0.6)',
  },
  cardTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: '#fff',
  },
  cardHookOverlay: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.75)',
  },
  sourceOverlay: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  // kept for legacy style references (unused in new layout but avoids TS errors)
  cardHook: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  readMorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.surface,
  },
  readMoreText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  spotifyPill: { backgroundColor: '#1DB95410', borderColor: '#1DB95435' },
  spotifyPillText: { color: '#0F8E3F' },
  kindlePill: { backgroundColor: '#C8782A10', borderColor: '#C8782A35' },
  kindlePillText: { color: '#A0561B' },

  // ─── Audio strip ─────────────────────────────────────────────────────────
  audioStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    backgroundColor: Colors.backgroundDeep,
  },
  audioStripActive: {
    backgroundColor: Colors.primaryGlow,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  playBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  playIcon: {
    fontSize: 9,
    color: Colors.primary,
    fontFamily: Fonts.sansBold,
  },
  playIconActive: {
    color: Colors.white,
  },
  audioLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textFaint,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.surfaceBorderStrong,
    borderRadius: 1,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  audioDuration: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textFaint,
  },

  // ─── Actions ─────────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  actionIcon: {
    fontSize: 15,
    color: Colors.textFaint,
  },
  actionIconActive: {
    color: Colors.primary,
  },
  actionCount: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textFaint,
  },
  actionCountActive: {
    color: Colors.primary,
  },
  planBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  planBtnText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // ─── States ──────────────────────────────────────────────────────────────
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
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
  },
});
