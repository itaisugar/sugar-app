import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { fetchContentItem } from '../../lib/contentItem';
import { FeedItem } from '../../lib/content';

export default function ArticleReader() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchContentItem(id!);
        setArticle(result);
      } catch (e: any) {
        setError(e?.message ?? 'Could not load this piece.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isSpotify = !!article?.contentUrl && /spotify\.com/i.test(article.contentUrl);

  const openOriginal = useCallback(async () => {
    if (!article?.contentUrl) return;
    try {
      if (isSpotify) await Linking.openURL(article.contentUrl);
      else await WebBrowser.openBrowserAsync(article.contentUrl);
    } catch {
      Alert.alert('Could not open the source.');
    }
  }, [article?.contentUrl, isSpotify]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Couldn't load this piece</Text>
          <Text style={[TextStyles.emptyDescription, { marginTop: 8, textAlign: 'center' }]}>
            {error ?? 'It may have been removed.'}
          </Text>
          <TouchableOpacity style={styles.backBtnPrimary} onPress={() => router.back()}>
            <Text style={TextStyles.buttonPrimary}>Back to feed</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={TextStyles.overline}>Reader</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setSaved(s => !s)} style={[styles.iconBtn, saved && styles.iconBtnActive]}>
            <Text style={[styles.iconBtnText, saved && { color: Colors.surface }]}>★</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress hairline */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '32%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Kicker */}
        <View style={styles.kickerRow}>
          <Text style={TextStyles.kicker}>{article.category} · {article.source}</Text>
          {article.trendingScore ? (
            <>
              <View style={styles.dot} />
              <Text style={TextStyles.overline}>Signal {article.trendingScore}</Text>
            </>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Dek (summary in italic) */}
        <Text style={styles.dek}>{article.summary}</Text>

        {/* Byline */}
        <View style={styles.byline}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{article.sourceAvatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bylineName}>{article.source}</Text>
            <Text style={styles.bylineMeta}>Editor's selection · {article.readTime} min read</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Hero image */}
        {article.image ? (
          <Image source={{ uri: article.image }} style={styles.heroImage} resizeMode="cover" />
        ) : null}

        {/* Audio / Spotify card */}
        {isSpotify ? (
          <TouchableOpacity style={styles.audioCard} onPress={openOriginal} activeOpacity={0.88}>
            <View style={[styles.audioPlay, { backgroundColor: '#1DB954' }]}>
              <Text style={styles.audioPlayIcon}>▶</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioLabel}>Listen on Spotify</Text>
              <Text style={styles.audioTitle}>{article.readTime} min · podcast</Text>
            </View>
            <Text style={styles.audioArrow}>↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* Body — drop cap on first paragraph, then read more */}
        <View style={styles.bodyBlock}>
          <Text style={styles.bodyParagraph}>
            <Text style={styles.dropCap}>{article.summary.charAt(0)}</Text>
            {article.summary.slice(1)}
          </Text>
        </View>

        {/* Continue reading CTA */}
        {article.contentUrl ? (
          <TouchableOpacity style={styles.continueBtn} onPress={openOriginal} activeOpacity={0.85}>
            <Text style={styles.continueText}>
              {isSpotify ? `Listen full episode on Spotify` : `Continue reading on ${article.source}`}
            </Text>
            <Text style={styles.continueArrow}>↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* Tags */}
        {article.tags.length > 0 ? (
          <View style={styles.tagsBlock}>
            <Text style={[TextStyles.overline, { marginBottom: 10 }]}>Filed under</Text>
            <View style={styles.tagRow}>
              {article.tags.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Bottom spacer for floating action bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating action bar */}
      <View style={styles.actionBarWrap}>
        <View style={styles.actionBar}>
          <ActionChip label={saved ? 'Saved' : 'Save'} onPress={() => setSaved(s => !s)} active={saved} />
          <ActionChip label="Plan it" primary />
          <ActionChip label="Share" />
          <ActionChip label="Note" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ActionChip({ label, onPress, primary, active }: { label: string; onPress?: () => void; primary?: boolean; active?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[
      styles.chip,
      primary && styles.chipPrimary,
      active && !primary && styles.chipActive,
    ]} activeOpacity={0.85}>
      <Text style={[
        styles.chipText,
        primary && styles.chipTextPrimary,
        active && !primary && styles.chipTextActive,
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 6 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconBtnText: { fontSize: 18, color: Colors.textPrimary },

  progressTrack: { height: 1.5, backgroundColor: Colors.surfaceBorder },
  progressFill: { height: '100%', backgroundColor: Colors.primary },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },

  kickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textFaint },

  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  dek: {
    fontFamily: Fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },

  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing.base,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.surface, fontFamily: Fonts.serif, fontSize: 14 },
  bylineName: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.textPrimary },
  bylineMeta: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.textPrimary,
  },
  followBtnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.sansSemibold, fontSize: 10,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },

  heroImage: {
    width: '100%', height: 200,
    marginTop: Spacing.lg, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
  },

  audioCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: Spacing.lg,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    backgroundColor: Colors.textPrimary,
  },
  audioPlay: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  audioPlayIcon: { color: Colors.surface, fontSize: 14, fontFamily: Fonts.sansBold },
  audioLabel: { color: Colors.textFaint, fontFamily: Fonts.monoMedium, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' },
  audioTitle: { color: Colors.surface, fontFamily: Fonts.serif, fontSize: 14, marginTop: 4 },
  audioArrow: { color: Colors.surface, fontSize: 18 },

  bodyBlock: { marginTop: Spacing.lg },
  bodyParagraph: {
    fontFamily: Fonts.serifRegular,
    fontSize: 17,
    lineHeight: 27,
    color: Colors.textSecondary,
  },
  dropCap: {
    fontFamily: Fonts.serif,
    fontSize: 56,
    lineHeight: 56,
    color: Colors.primary,
  },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.lg,
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  continueText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.primary, letterSpacing: 0.3 },
  continueArrow: { color: Colors.primary, fontSize: 18 },

  tagsBlock: { marginTop: Spacing.xl },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
  },
  tagText: { fontFamily: Fonts.monoMedium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: Colors.textMuted },

  actionBarWrap: {
    position: 'absolute',
    bottom: Spacing.base, left: 0, right: 0,
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 4,
    padding: 6,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorderStrong,
    ...Shadow.lg,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999,
  },
  chipPrimary: { backgroundColor: Colors.textPrimary },
  chipActive: { backgroundColor: Colors.background },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.textPrimary, letterSpacing: 0.3 },
  chipTextPrimary: { color: Colors.surface, fontFamily: Fonts.sansBold },
  chipTextActive: { color: Colors.textPrimary, fontFamily: Fonts.sansSemibold },

  backBtnPrimary: {
    marginTop: 16,
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
});
