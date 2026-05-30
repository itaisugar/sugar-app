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
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { fetchContentItem } from '../../lib/contentItem';
import { FeedItem } from '../../lib/content';
import { detectLinkKind, openExternal } from '../../lib/externalLinks';
import { isItemSaved, saveItem, unsaveItem } from '../../lib/saved';
import { isItemRead, markAsRead, unmarkAsRead } from '../../lib/reads';
import { addLeaf, removeLeaf, getLeafBranch } from '../../lib/knowledge';
import { useProfile } from '../../lib/ProfileContext';
import { usePodcastPlayer } from '../../lib/PodcastPlayerContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function ArticleReader() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, refresh: refreshProfile } = useProfile();
  const player = usePodcastPlayer();
  const { getTranslation, ensureTranslation } = useLanguage();
  const [hebrew, setHebrew] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [article, setArticle] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [read, setRead] = useState(false);
  const [readBusy, setReadBusy] = useState(false);

  // Audio comes from the global PodcastPlayerContext — same instance the
  // Feed cards use, so playback continues when navigating between screens
  // and only one piece can play at a time.
  const speaking = id ? player.isActive(id) && player.isPlaying : false;

  // Knowledge state
  const [leafBranch, setLeafBranch] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [leafBusy, setLeafBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchContentItem(id!);
        setArticle(result);
        if (id) {
          const [s, b, r] = await Promise.all([isItemSaved(id), getLeafBranch(id), isItemRead(id)]);
          setSaved(s);
          setLeafBranch(b);
          setRead(r);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Could not load this piece.');
      } finally {
        setLoading(false);
      }
    })();
    // Do NOT stop playback on unmount — the user may want audio to keep
    // playing as they navigate away (handled by global player).
  }, [id]);

  // ── Audio summary ──────────────────────────────────────────────────────
  const playSummary = async () => {
    if (!article || !id) return;
    await player.play({
      id,
      title: article.title,
      source: article.source,
      audioUrl: article.audioUrl,
      imageUrl: article.image,
      ttsText: `${article.title}. ${article.summary}`,
    });
  };
  const stopSummary = async () => {
    await player.stop();
  };

  // ── Add to knowledge ──────────────────────────────────────────────────
  const userInterests = profile?.interests ?? [];
  const pickBranch = async (branch: string) => {
    if (!id || leafBusy) return;
    setLeafBusy(true);
    const prev = leafBranch;
    setLeafBranch(branch);
    setPickerOpen(false);
    try {
      await addLeaf(id, branch);
    } catch {
      setLeafBranch(prev);
    } finally {
      setLeafBusy(false);
    }
  };
  const removeFromKnowledge = async () => {
    if (!id || leafBusy) return;
    setLeafBusy(true);
    const prev = leafBranch;
    setLeafBranch(null);
    try {
      await removeLeaf(id);
    } catch {
      setLeafBranch(prev);
    } finally {
      setLeafBusy(false);
    }
  };

  const toggleRead = async () => {
    if (!id || readBusy) return;
    const prev = read;
    setRead(!prev);
    setReadBusy(true);
    try {
      if (prev) await unmarkAsRead(id);
      else await markAsRead(id);
      await refreshProfile();
    } catch {
      setRead(prev);
    } finally {
      setReadBusy(false);
    }
  };

  const toggleSave = async () => {
    if (!id || saveBusy) return;
    const prev = saved;
    setSaved(!prev);
    setSaveBusy(true);
    try {
      if (prev) await unsaveItem(id);
      else await saveItem(id);
      await refreshProfile();
    } catch {
      setSaved(prev);
    } finally {
      setSaveBusy(false);
    }
  };

  const translation = id ? getTranslation(id) : undefined;
  const showHebrew = hebrew && !!translation;
  const displayTitle = showHebrew ? translation!.title_he : article?.title ?? '';
  const displayHook =
    showHebrew ? (translation!.hook_he ?? null) : (article?.hook ?? null);
  const displayBody = showHebrew ? translation!.summary_he : article?.summary ?? '';
  const rtl = showHebrew ? { writingDirection: 'rtl' as const, textAlign: 'right' as const } : undefined;

  const onToggleHebrew = async () => {
    if (!id) return;
    if (hebrew) {
      setHebrew(false);
      return;
    }
    if (translation) {
      setHebrew(true);
      return;
    }
    setTranslating(true);
    setTranslateError(null);
    try {
      await ensureTranslation(id);
      setHebrew(true);
    } catch (e: any) {
      setTranslateError(e?.message ?? 'Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  const linkKind = detectLinkKind(article?.contentUrl);
  const isSpotify = linkKind === 'spotify';
  const isKindle = linkKind === 'kindle';

  const openOriginal = useCallback(async () => {
    if (!article?.contentUrl) return;
    await openExternal(article.contentUrl, linkKind);
  }, [article?.contentUrl, linkKind]);

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
          <TouchableOpacity onPress={toggleSave} disabled={saveBusy} style={[styles.iconBtn, saved && styles.iconBtnActive]}>
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
        </View>

        {/* Hebrew translation toggle */}
        <TouchableOpacity
          onPress={onToggleHebrew}
          disabled={translating}
          style={[styles.translateBtn, showHebrew && styles.translateBtnActive]}
          activeOpacity={0.85}
        >
          {translating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.translateBtnText, showHebrew && styles.translateBtnTextActive]}>
              {showHebrew ? 'Show in English' : 'תרגם לעברית · Translate to Hebrew'}
            </Text>
          )}
        </TouchableOpacity>
        {translateError ? (
          <Text style={[TextStyles.error, { marginBottom: 8 }]}>{translateError}</Text>
        ) : null}

        {/* Title */}
        <Text style={[styles.title, rtl]}>{displayTitle}</Text>

        {/* Dek (summary in italic) */}
        {displayHook ? (
          <Text style={[styles.dek, rtl]}>{displayHook}</Text>
        ) : null}

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

        {/* Audio summary — narrated via device TTS */}
        <TouchableOpacity
          style={[styles.audioCard, speaking && styles.audioCardActive]}
          onPress={speaking ? stopSummary : playSummary}
          activeOpacity={0.88}
        >
          <View style={[styles.audioPlay, { backgroundColor: Colors.primary }]}>
            <Text style={styles.audioPlayIcon}>{speaking ? '❚❚' : '▶'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.audioLabel}>{speaking ? 'Narrating' : 'Listen to summary'}</Text>
            <Text style={styles.audioTitle}>
              {speaking ? 'Tap to stop' : 'AI voice · ~1 min'}
            </Text>
          </View>
          <Text style={styles.audioArrow}>{speaking ? '◼' : '◐'}</Text>
        </TouchableOpacity>

        {/* External app card — Spotify or Kindle */}
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
        {isKindle ? (
          <TouchableOpacity style={styles.audioCard} onPress={openOriginal} activeOpacity={0.88}>
            <View style={[styles.audioPlay, { backgroundColor: '#C8782A' }]}>
              <Text style={styles.audioPlayIcon}>❡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioLabel}>Open in Kindle</Text>
              <Text style={styles.audioTitle}>{article.readTime} min · book</Text>
            </View>
            <Text style={styles.audioArrow}>↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* Body — drop cap on first paragraph, paragraph breaks on the rest */}
        <View style={styles.bodyBlock}>
          {(() => {
            const paragraphs = displayBody
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean);
            if (paragraphs.length === 0) return null;
            return paragraphs.map((p, idx) => {
              if (idx === 0 && !showHebrew) {
                return (
                  <Text key={idx} style={styles.bodyParagraph}>
                    <Text style={styles.dropCap}>{p.charAt(0)}</Text>
                    {p.slice(1)}
                  </Text>
                );
              }
              return (
                <Text
                  key={idx}
                  style={[styles.bodyParagraph, rtl, idx > 0 && { marginTop: 16 }]}
                >
                  {p}
                </Text>
              );
            });
          })()}
        </View>

        {/* Continue reading CTA */}
        {article.contentUrl ? (
          <TouchableOpacity style={styles.continueBtn} onPress={openOriginal} activeOpacity={0.85}>
            <Text style={styles.continueText}>
              {isSpotify
                ? `Listen full episode on Spotify`
                : isKindle
                  ? `Read full book in Kindle`
                  : `Continue reading on ${article.source}`}
            </Text>
            <Text style={styles.continueArrow}>↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* Add to knowledge */}
        <View style={styles.knowledgeBlock}>
          <Text style={[TextStyles.overline, { marginBottom: 10 }]}>Knowledge tree</Text>
          {leafBranch ? (
            <View style={styles.leafCard}>
              <Text style={styles.leafText}>
                Filed under <Text style={{ fontFamily: Fonts.serifItalicMedium, color: Colors.primary }}>{leafBranch}</Text>
              </Text>
              <View style={styles.leafActions}>
                <TouchableOpacity onPress={() => setPickerOpen(o => !o)} style={styles.leafBtn}>
                  <Text style={styles.leafBtnText}>Move</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={removeFromKnowledge} style={styles.leafBtnGhost}>
                  <Text style={styles.leafBtnGhostText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addToKnowledgeBtn}
              onPress={() => setPickerOpen(o => !o)}
              activeOpacity={0.85}
            >
              <Text style={styles.addToKnowledgeText}>＋ Add to knowledge</Text>
            </TouchableOpacity>
          )}

          {pickerOpen ? (
            <View style={styles.branchPicker}>
              <Text style={[TextStyles.tagline, { marginBottom: 10 }]}>
                Choose a branch to graft this onto.
              </Text>
              {userInterests.length === 0 ? (
                <Text style={TextStyles.helper}>
                  You haven't picked any interests yet. Edit your profile to add some.
                </Text>
              ) : (
                <View style={styles.branchChips}>
                  {userInterests.map(b => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => pickBranch(b)}
                      disabled={leafBusy}
                      style={[
                        styles.branchChip,
                        b === leafBranch && styles.branchChipActive,
                      ]}
                    >
                      <Text style={[
                        styles.branchChipText,
                        b === leafBranch && styles.branchChipTextActive,
                      ]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Mark as read */}
        <TouchableOpacity
          onPress={toggleRead}
          disabled={readBusy}
          activeOpacity={0.85}
          style={[styles.readBtn, read && styles.readBtnDone]}
        >
          {readBusy ? (
            <ActivityIndicator size="small" color={read ? Colors.surface : Colors.primary} />
          ) : (
            <Text style={[styles.readBtnText, read && styles.readBtnTextDone]}>
              {read ? '✓ Marked as read' : '＋ I read this article'}
            </Text>
          )}
        </TouchableOpacity>

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
          <ActionChip label={saved ? 'Saved' : 'Save'} onPress={toggleSave} active={saved} />
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

  translateBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.surfaceMuted,
    marginBottom: 14,
  },
  translateBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  translateBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  translateBtnTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },
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
  audioCardActive: {
    backgroundColor: Colors.primaryDark,
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

  knowledgeBlock: { marginTop: Spacing.xl },
  addToKnowledgeBtn: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
  },
  addToKnowledgeText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  leafCard: {
    padding: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 0.5,
    borderColor: Colors.primary,
  },
  leafText: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  leafActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  leafBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  leafBtnText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    color: Colors.surface,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  leafBtnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorderStrong,
  },
  leafBtnGhostText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  branchPicker: {
    marginTop: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  branchChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  branchChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.transparent,
  },
  branchChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  branchChipText: {
    fontFamily: Fonts.serifRegular,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  branchChipTextActive: {
    color: Colors.primary,
  },
  readBtn: {
    marginTop: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
  },
  readBtnDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  readBtnText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 13,
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  readBtnTextDone: {
    color: Colors.surface,
  },
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
