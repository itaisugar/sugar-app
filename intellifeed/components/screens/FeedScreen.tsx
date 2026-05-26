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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../../constants/Theme';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';
import { fetchContentItems, FeedItem } from '../../lib/content';

const CATEGORIES = ['All', 'Science', 'AI', 'Philosophy', 'Performance', 'Geopolitics', 'Business'];

const SOURCE_LABELS: Record<string, string> = {
  curated: "From the Editor's Desk",
  featured: 'Featured This Week',
  community: 'Notable in the Community',
};

function FeedCard({ item, onSave, onLike }: { item: FeedItem; onSave: () => void; onLike: () => void }) {
  const [playing, setPlaying] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const openArticle = async () => {
    if (!item.contentUrl) {
      Alert.alert(
        'Full article unavailable',
        'A link to the original source has not been attached to this piece yet.',
      );
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(item.contentUrl, {
        toolbarColor: Colors.background,
        controlsColor: Colors.primary,
        dismissButtonStyle: 'close',
      });
    } catch {
      Alert.alert('Could not open the article', 'Please try again in a moment.');
    }
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
          <View style={[styles.categoryPill, { borderColor: item.categoryColor + '60' }]}>
            <Text style={[styles.categoryText, { color: item.categoryColor }]}>{item.category}</Text>
          </View>
          {item.trendingScore && (
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingText}>Signal {item.trendingScore}</Text>
            </View>
          )}
          <Text style={styles.timestampText}>{item.timestamp}</Text>
        </View>

        <Text style={[TextStyles.cardTitle, styles.cardTitle]}>{item.title}</Text>
        <Text style={[TextStyles.bodySecondary, styles.cardSummary]} numberOfLines={4}>{item.summary}</Text>

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
            <View style={styles.readMorePill}>
              <Text style={styles.readMoreText}>Read article  ↗</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {item.podcastDuration && (
        <TouchableOpacity
          style={[styles.podcastPlayer, playing && styles.podcastPlayerActive]}
          onPress={() => setPlaying(!playing)}
        >
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>{playing ? '||' : '▶'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.podcastLabel}>Listen — Distilled Audio</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: playing ? '35%' : '0%' }]} />
            </View>
          </View>
          <Text style={styles.podcastDuration}>{formatDuration(item.podcastDuration)}</Text>
        </TouchableOpacity>
      )}

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
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchContentItems();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the feed. Please try again.');
    }
  }, []);

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

  const handleSave = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, isSaved: !item.isSaved, saves: item.isSaved ? item.saves - 1 : item.saves + 1 }
          : item
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={TextStyles.kicker}>
            {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Knowledge, Distilled'}
          </Text>
          <Text style={[TextStyles.appTitle, { marginTop: 4 }]}>Sapiens</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{'✱'}  14 day streak</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn} accessibilityLabel="Sign out">
            <Text style={styles.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[TextStyles.tagline, styles.tagline]}>Upgrade Your Cognitive Diet.</Text>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search the library…"
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
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
  logoutIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Fonts.sansBold,
  },
  tagline: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
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
