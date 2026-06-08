import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { Equalizer, CatTag, GoldBadge, MemberFaces, EntranceView } from '../ui';
import { detectLinkKind, ctaLabelFor } from '../../lib/externalLinks';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';
import { usePodcastPlayer } from '../../lib/PodcastPlayerContext';
import { fetchContentItems, FeedItem } from '../../lib/content';
import { saveItem, unsaveItem, getSavedSubset } from '../../lib/saved';
import { useLanguage, type Language } from '../../lib/LanguageContext';
import { fetchJoinedClubsActivity, ClubActivity } from '../../lib/clubs';
import { fetchFollowedActivity, activityVerb, FollowActivity } from '../../lib/social';
import { touchDayStreak } from '../../lib/streak';
import { getDailyQuote } from '../../lib/quotes';
import { CLUBS, feedItemReaders } from '../../constants/MockData';
import { getCategoryStyle } from '../../constants/Categories';
import { generateBriefing, type Briefing } from '../../lib/briefing';
import { narrateItem } from '../../lib/narrate';

const CATEGORIES = ['For You', 'Science', 'AI', 'Philosophy', 'Performance', 'Geopolitics', 'Business'];

// Sort modes for the feed stream (the "LATEST" divider doubles as the selector).
type SortMode = 'latest' | 'popular' | 'relevant';
const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'latest', label: 'Latest' },
  { mode: 'popular', label: 'Most Popular' },
  { mode: 'relevant', label: 'Most Relevant' },
];

// Languages offered by the translate menu, in display order.
const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
];

// A clean, monochrome line-art globe — tinted by `color` so it can sit quietly
// in the header and warm to the accent when its menu is open.
function GlobeIcon({ color, size = 19 }: { color: string; size?: number }) {
  // Snap geometry to whole/half pixels so strokes land on the pixel grid and
  // render crisp instead of soft. Thin, even strokes read sharper than heavy
  // ones at this size (heavier strokes just spread the anti-aliased edge).
  const px = Math.round(size);
  const c = px / 2;
  const r = Math.round(px / 2 - 2) + 0.5;
  return (
    <Svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
      <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={1.25} fill="none" />
      <Ellipse cx={c} cy={c} rx={r * 0.55} ry={r} stroke={color} strokeWidth={1.25} fill="none" />
      <Line x1={c - r} y1={c} x2={c + r} y2={c} stroke={color} strokeWidth={1.25} />
      <Line x1={c - r * 0.82} y1={c - r * 0.5} x2={c + r * 0.82} y2={c - r * 0.5} stroke={color} strokeWidth={1} />
      <Line x1={c - r * 0.82} y1={c + r * 0.5} x2={c + r * 0.82} y2={c + r * 0.5} stroke={color} strokeWidth={1} />
    </Svg>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  curated: "From the Editor's Desk",
  featured: 'Featured This Week',
  community: 'Notable in the Community',
};

// ─── Instagram-style article carousel ─────────────────────────────────────────
// Turns a single article into a swipeable "post": a cover slide (image + title)
// followed by readable text slides built from the hook + summary, then a CTA.

// Group the article text into slides of up to 4 sentences each (with a char cap
// so a slide always fits the Instagram-sized card). Cover + these + CTA.
const MAX_SENTENCES_PER_SLIDE = 4;
const MAX_CHARS_PER_SLIDE = 320;
const MAX_CONTENT_SLIDES = 4;

function splitIntoSlides(lede: string | null, body: string | null): string[] {
  const text = [(lede ?? '').trim(), (body ?? '').trim()].filter(Boolean).join(' ').trim();
  if (!text) return [];
  const sentences = (text.match(/[^.!?…]+[.!?…]+/g) ?? [text]).map((s) => s.trim()).filter(Boolean);

  const slides: string[] = [];
  let cur: string[] = [];
  let curLen = 0;
  for (const s of sentences) {
    if (cur.length && (cur.length >= MAX_SENTENCES_PER_SLIDE || curLen + s.length > MAX_CHARS_PER_SLIDE)) {
      slides.push(cur.join(' '));
      cur = [];
      curLen = 0;
    }
    cur.push(s);
    curLen += s.length + 1;
  }
  if (cur.length) slides.push(cur.join(' '));
  return slides.slice(0, MAX_CONTENT_SLIDES);
}

// Bold any numeric tokens (prices, percentages) inside a slide line — mirrors the
// "5,300 / 19,000" emphasis in the reference design.
function renderEmphasis(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  const regex = /(\d[\d.,]*\s?[%$₪]?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<Text key={k++} style={styles.slideBold}>{m[0]}</Text>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// The sharp cover image with a bottom-weighted scrim so text sits over the
// darker lower third (falls back to a tint gradient when there's no image).
function SlideBackdrop({ image, tint }: { image: string; tint: string }) {
  if (!image) {
    return (
      <LinearGradient
        colors={[Colors.surfaceElevated, Colors.surface, tint + '22']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  return (
    <>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(8,7,9,0.06)', 'rgba(8,7,9,0.45)', 'rgba(8,7,9,0.93)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );
}

function TextSlide({
  text, image, tint, source, rtl,
}: {
  text: string; image: string; tint: string; source: string;
  rtl?: { writingDirection: 'rtl'; textAlign: 'right' } | undefined;
}) {
  return (
    <View style={styles.slide}>
      <SlideBackdrop image={image} tint={tint} />
      <View style={styles.slideBottom}>
        <Text style={[rtl, styles.slideText]}>{renderEmphasis(text)}</Text>
        <Text style={styles.slideBrand}>{source}</Text>
      </View>
    </View>
  );
}

function CtaSlide({ image, tint, source, readTime }: { image: string; tint: string; source: string; readTime: number }) {
  return (
    <View style={styles.slide}>
      <SlideBackdrop image={image} tint={tint} />
      <View style={styles.slideBottom}>
        <Text style={styles.ctaTitleC}>Read the full piece</Text>
        <Text style={styles.ctaSubC}>{readTime} min · {source}</Text>
        <View style={styles.ctaBtn}><Text style={styles.ctaBtnText}>Open article →</Text></View>
      </View>
    </View>
  );
}

function ArticleCarousel({
  lead, image, coverBg, cover, slides, tint, category, readTime, source, rtl, onOpen,
}: {
  lead: boolean;
  image: string;
  coverBg: string;
  cover: React.ReactNode;
  slides: string[];
  tint: string;
  category: string;
  readTime: number;
  source: string;
  rtl?: { writingDirection: 'rtl'; textAlign: 'right' } | undefined;
  onOpen: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [w, setW] = useState(Dimensions.get('window').width - Spacing.lg * 2 - 2);
  const height = Math.round(w * 1.25); // Instagram-style 4:5 portrait
  const pages = slides.length + 2; // cover + content slides + CTA

  return (
    <View
      onLayout={(e) => {
        const lw = e.nativeEvent.layout.width;
        if (lw && Math.abs(lw - w) > 1) setW(lw);
      }}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / w))}
      >
        {/* Cover */}
        <Pressable onPress={onOpen} style={{ width: w, height }}>
          {image ? (
            <ImageBackground source={{ uri: image }} style={{ width: '100%', height: '100%' }}>
              {cover}
            </ImageBackground>
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: coverBg }}>{cover}</View>
          )}
        </Pressable>

        {/* Content slides */}
        {slides.map((t, i) => (
          <Pressable key={i} onPress={onOpen} style={{ width: w, height }}>
            <TextSlide text={t} image={image} tint={tint} source={source} rtl={rtl} />
          </Pressable>
        ))}

        {/* CTA */}
        <Pressable onPress={onOpen} style={{ width: w, height }}>
          <CtaSlide image={image} tint={tint} source={source} readTime={readTime} />
        </Pressable>
      </ScrollView>

      {/* Page dots */}
      <View style={styles.dotsRow} pointerEvents="none">
        {Array.from({ length: pages }).map((_, i) => (
          <View key={i} style={[styles.cdot, i === idx && styles.cdotActive]} />
        ))}
      </View>
    </View>
  );
}

function FeedCard({ item, onSave, onLike, lead = false }: { item: FeedItem; onSave: () => void; onLike: () => void; lead?: boolean }) {
  const router = useRouter();
  const player = usePodcastPlayer();
  const { profile } = useProfile();
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
  // Instagram-style slides: lede (hook) + the summary split into readable pages.
  const ledeText = isHebrew && translation ? (translation.hook_he ?? null) : (item.hook ?? null);
  const bodyText = isHebrew && translation ? translation.summary_he : item.summary;
  const contentSlides = useMemo(() => splitIntoSlides(ledeText, bodyText), [ledeText, bodyText]);
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
  const tint = categoryStyle.gradientEnd;

  // #2 — transparent "why this is in your feed", computed locally from the
  // user's interests (no model call). Falls back to an honest "editor's pick".
  const interests = profile?.interests ?? [];
  const match =
    interests.find(i => i.toLowerCase() === item.category.toLowerCase()) ??
    interests.find(i => item.tags.some(t => t.toLowerCase() === i.toLowerCase()));
  const reason = match
    ? (isHebrew ? `נבחר כי בחרת ב${match}` : `Because you chose ${match}`)
    : (isHebrew ? 'בחירת העורכים' : 'Editor’s pick');

  // #1 — a self-relevant signal (effort to read) instead of social proof.
  const complexity =
    item.readTime <= 4 ? (isHebrew ? 'קריאה קצרה' : 'Quick read')
    : item.readTime <= 8 ? (isHebrew ? 'בינוני' : 'Medium')
    : (isHebrew ? 'קריאה עמוקה' : 'Deep read');

  const HeroOverlay = (
    <>
      {/* multi-stop scrim with a wash of the category tint */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8,7,9,0.12)', 'rgba(8,7,9,0.40)', tint + '2E', 'rgba(8,7,9,0.94)']}
        locations={[0, 0.48, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroOverlay}>
        <View style={styles.cardOverlayTop}>
          <CatTag category={item.category} onDark />
          <Text style={styles.timestampOverlay}>{item.timestamp}</Text>
        </View>
        <View>
          <Text style={[lead ? styles.cardTitleLead : styles.cardTitle, rtlText]} numberOfLines={3}>{displayTitle}</Text>
          {isTranslating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              <Text style={styles.cardHookOverlay}>מתרגם…</Text>
            </View>
          ) : (
            <Text style={[styles.cardHookOverlay, rtlText]} numberOfLines={2}>{displayHook}</Text>
          )}
          <Text style={styles.sourceOverlay} numberOfLines={1}>{item.source} · {item.readTime} min · {complexity}</Text>
          {/* transparent reason line */}
          <View style={styles.reasonRow}>
            <Text style={styles.reasonGlyph}>✦</Text>
            <Text style={[styles.reasonText, rtlText]} numberOfLines={1}>{reason}</Text>
          </View>
          {/* swipe affordance — there are more slides to the side */}
          <Text style={styles.swipeHint}>{isHebrew ? '‹‹‹ החליקו' : 'Swipe ›››'}</Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.card, lead && styles.cardLead]}>
      {/* Hero carousel — Instagram-style: cover + swipeable content slides */}
      <ArticleCarousel
        lead={lead}
        image={item.image}
        coverBg={categoryStyle.gradientStart}
        cover={HeroOverlay}
        slides={contentSlides}
        tint={tint}
        category={item.category}
        readTime={item.readTime}
        source={item.source}
        rtl={rtlText}
        onOpen={openArticle}
      />

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
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const { language, setLanguage, ensureTranslations } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [langMenuPos, setLangMenuPos] = useState({ top: 0, right: Spacing.lg });
  const globeBtnRef = useRef<any>(null);

  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortMenuPos, setSortMenuPos] = useState({ top: 0, left: Spacing.lg });
  const sortLabelRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('For You');
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

  // Gesture-coupled header: height/opacity follow the scroll finger in BOTH
  // directions, so the reveal/collapse always matches your scroll speed. Forced
  // fully open at the very top.
  const scrollY = useRef(new Animated.Value(0)).current;
  const collapseY = useRef(new Animated.Value(0)).current; // 0 = open .. topH = collapsed
  const offset = useRef(0);
  const lastY = useRef(0);
  const [topH, setTopH] = useState(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const max = topH;
      if (!max) { lastY.current = value; return; }
      const dy = value - lastY.current;
      lastY.current = value;
      let next: number;
      if (value <= 0) {
        next = 0; // at the top → fully open
      } else {
        next = offset.current + dy;
        if (next < 0) next = 0;
        else if (next > max) next = max;
      }
      offset.current = next;
      collapseY.setValue(next);
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, collapseY, topH]);

  const onFeedScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const collapsibleStyle = topH
    ? {
        overflow: 'hidden' as const,
        height: collapseY.interpolate({ inputRange: [0, topH], outputRange: [topH, 0] }),
        opacity: collapseY.interpolate({ inputRange: [0, topH], outputRange: [1, 0] }),
      }
    : { overflow: 'hidden' as const };

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
      // De-duplicate so the same article can never show up twice on the feed
      // (whether back-to-back or spaced apart), keeping the first occurrence.
      // Keyed by canonical content URL when available, else by normalized title,
      // so duplicate DB rows that share content but have different ids are caught.
      const seen = new Set<string>();
      const dedupeKey = (d: typeof data[number]) => {
        const url = d.contentUrl?.trim().toLowerCase();
        if (url) return `u:${url}`;
        return `t:${d.title.trim().toLowerCase().replace(/\s+/g, ' ')}`;
      };
      const unique = data.filter(d => {
        const k = dedupeKey(d);
        return seen.has(k) ? false : (seen.add(k), true);
      });
      const savedIds = await getSavedSubset(unique.map(d => d.id));
      setItems(unique.map(d => ({ ...d, isSaved: savedIds.has(d.id) })));
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

  // Anchor the dropdown under the globe, aligned to its right edge.
  const openLangMenu = () => {
    globeBtnRef.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
      setLangMenuPos({ top: y + h + 8, right: Dimensions.get('window').width - (x + w) });
      setLangMenuOpen(true);
    });
  };

  const selectLanguage = (code: Language) => {
    setLanguage(code);
    setLangMenuOpen(false);
  };

  const openSortMenu = () => {
    sortLabelRef.current?.measureInWindow((x: number, y: number, _w: number, h: number) => {
      setSortMenuPos({ top: y + h + 8, left: x });
      setSortMenuOpen(true);
    });
  };
  const selectSort = (mode: SortMode) => {
    setSortMode(mode);
    setSortMenuOpen(false);
  };
  const sortLabel = SORT_OPTIONS.find(o => o.mode === sortMode)?.label ?? 'Latest';

  const displayName = profile?.full_name ?? user?.email ?? 'I';
  const initial = displayName.charAt(0).toUpperCase();
  const userInterests = profile?.interests ?? [];
  const hasInterests = userInterests.length > 0;

  const lowerInterests = userInterests.map(i => i.toLowerCase());

  const filteredItems = items.filter(item => {
    let matchesCategory: boolean;
    if (selectedCategory === 'For You') {
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

  // Apply the chosen sort. 'latest' keeps the fetch order (newest first).
  const sortedItems = (() => {
    if (sortMode === 'latest') return filteredItems;
    const arr = [...filteredItems];
    if (sortMode === 'popular') {
      arr.sort((a, b) => (b.likes + b.saves) - (a.likes + a.saves));
    } else {
      // 'relevant': rank by how many of the user's interests an item matches,
      // tie-broken by popularity.
      const relevance = (it: FeedItem) =>
        lowerInterests.reduce(
          (n, i) =>
            n +
            (it.category.toLowerCase().includes(i) ||
            it.tags.some(t => t.toLowerCase().includes(i))
              ? 1
              : 0),
          0,
        );
      arr.sort((a, b) => {
        const d = relevance(b) - relevance(a);
        return d !== 0 ? d : (b.likes + b.saves) - (a.likes + a.saves);
      });
    }
    return arr;
  })();

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
            ref={globeBtnRef}
            onPress={openLangMenu}
            style={[styles.globeBtn, langMenuOpen && styles.globeBtnActive]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Translate"
          >
            <GlobeIcon color={langMenuOpen ? Colors.primary : Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarPhoto} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={langMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangMenuOpen(false)}
      >
        <Pressable style={styles.langBackdrop} onPress={() => setLangMenuOpen(false)}>
          <View style={[styles.langMenu, { top: langMenuPos.top, right: langMenuPos.right }]}>
            {LANGUAGE_OPTIONS.map((opt, i) => {
              const active = language === opt.code;
              return (
                <React.Fragment key={opt.code}>
                  {i > 0 ? <View style={styles.langMenuDivider} /> : null}
                  <TouchableOpacity
                    style={styles.langMenuItem}
                    activeOpacity={0.7}
                    onPress={() => selectLanguage(opt.code)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.langMenuText, active && styles.langMenuTextActive]}>
                      {opt.label}
                    </Text>
                    {active ? <Text style={styles.langMenuCheck}>✓</Text> : null}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <Pressable style={styles.langBackdrop} onPress={() => setSortMenuOpen(false)}>
          <View style={[styles.langMenu, { top: sortMenuPos.top, left: sortMenuPos.left }]}>
            {SORT_OPTIONS.map((opt, i) => {
              const active = sortMode === opt.mode;
              return (
                <React.Fragment key={opt.mode}>
                  {i > 0 ? <View style={styles.langMenuDivider} /> : null}
                  <TouchableOpacity
                    style={styles.langMenuItem}
                    activeOpacity={0.7}
                    onPress={() => selectSort(opt.mode)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.langMenuText, active && styles.langMenuTextActive]}>
                      {opt.label}
                    </Text>
                    {active ? <Text style={styles.langMenuCheck}>✓</Text> : null}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <Animated.View
        onLayout={(e: { nativeEvent: { layout: { height: number } } }) => {
          const h = e.nativeEvent.layout.height;
          if (h && !topH) setTopH(h);
        }}
        style={collapsibleStyle}
      >
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
      </Animated.View>

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
          data={sortedItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: 20 }}
          showsVerticalScrollIndicator={false}
          onScroll={onFeedScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: 16, marginBottom: 4 }}>
              {/* Today's Briefing — gradient banner */}
              {items.length >= 1 ? (
                <View>
                  <TouchableOpacity
                    onPress={onGenerateBriefing}
                    disabled={briefingBusy}
                    activeOpacity={0.9}
                    style={[styles.briefingShadow, briefingBusy && { opacity: 0.85 }]}
                  >
                    <LinearGradient
                      colors={[Colors.primaryDark, Colors.primary, Colors.primaryDark]}
                      locations={[0, 0.58, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.briefingStrip}
                    >
                      {/* top-left white sheen */}
                      <View style={styles.briefingSheen} pointerEvents="none" />
                      <View style={styles.briefingPlayBtn}>
                        {briefingBusy
                          ? <ActivityIndicator size="small" color={Colors.white} />
                          : <Text style={styles.briefingPlayIcon}>{briefingPlaying ? '❚❚' : '▶'}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.briefingStripTitle} numberOfLines={1}>
                            {briefingActive ? briefing!.title : "Today's Briefing"}
                          </Text>
                          {!briefingActive && !briefingBusy ? (
                            <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                          ) : null}
                        </View>
                        <Text style={styles.briefingStripSub}>
                          {briefingBusy
                            ? 'Preparing your briefing…'
                            : briefingActive
                              ? (briefingPlaying ? 'Narrating · tap to pause' : 'Paused · tap to resume')
                              : 'Three pieces · narrated for you'}
                        </Text>
                      </View>
                      {briefingPlaying ? (
                        <Equalizer playing color={Colors.white} />
                      ) : briefing ? (
                        <TouchableOpacity
                          onPress={() => setShowScript(s => !s)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Text style={styles.briefingStripArrow}>{showScript ? '⌄' : '›'}</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.briefingStripArrow}>›</Text>
                      )}
                    </LinearGradient>
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

              {/* Sort selector — doubles as the editorial section divider */}
              {sortedItems.length > 0 ? (
                <View style={styles.streamLabel}>
                  <TouchableOpacity
                    ref={sortLabelRef}
                    onPress={openSortMenu}
                    activeOpacity={0.7}
                    style={styles.streamLabelBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Change feed sort order"
                  >
                    <Text style={styles.streamLabelText}>{sortLabel}</Text>
                    <Text style={styles.streamCaret}>▾</Text>
                  </TouchableOpacity>
                  <View style={styles.streamRule} />
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <EntranceView delay={Math.min(index, 6) * 45}>
              <FeedCard
                item={item}
                lead={index === 0}
                onLike={() => handleLike(item.id)}
                onSave={() => handleSave(item.id)}
              />
            </EntranceView>
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
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  streakText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  globeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.background,
  },
  globeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  // Dropdown overlay — transparent so the feed stays visible behind it.
  langBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  langMenu: {
    position: 'absolute',
    minWidth: 168,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  langMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
  },
  langMenuDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  langMenuText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  langMenuTextActive: {
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
  },
  langMenuCheck: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },
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
  avatarPhoto: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  briefingShadow: {
    borderRadius: Radius.lg,
    ...Shadow.glow,
  },
  briefingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.hairlineGold,
    overflow: 'hidden',
  },
  briefingSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderBottomRightRadius: 120,
  },
  briefingPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingPlayIcon: {
    fontSize: 13,
    color: Colors.white,
    fontFamily: Fonts.sansBold,
  },
  briefingStripTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.white,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  newBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: Colors.white,
  },
  briefingStripSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  briefingStripArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.6)',
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
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardLead: {
    borderColor: Colors.hairlineGold,
    ...Shadow.glow,
  },
  // Hero image / gradient area
  cardHeroBg: {
    width: '100%',
    height: 210,
  },
  cardHeroBgLead: {
    height: 280,
  },
  // ─── Carousel (Instagram-style slides) ──────────────────────────────────────
  dotsRow: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  cdot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cdotActive: {
    width: 16,
    backgroundColor: '#fff',
  },
  // CashFlow-style slides: sharp image, bottom-weighted scrim, centered text.
  slide: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  slideBottom: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  slideText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 18,
    lineHeight: 26,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  slideBold: {
    fontFamily: Fonts.sansBold,
    color: '#fff',
  },
  slideBrand: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 14,
  },
  ctaTitleC: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: -0.3,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ctaSubC: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    marginTop: 6,
  },
  textSlide: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  textSlideOverline: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  textSlideText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  // Lighter variants for text sitting over the dimmed cover image.
  onImageOverline: {
    color: 'rgba(255,255,255,0.78)',
  },
  onImageText: {
    color: '#fff',
  },
  onImageSub: {
    color: 'rgba(255,255,255,0.82)',
  },
  ctaSlide: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaKicker: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.primary,
    marginBottom: 8,
  },
  ctaTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  ctaSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  ctaBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  ctaBtnText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
    color: Colors.onPrimary,
  },
  // Full-bleed overlay: top row pinned top, headline block pinned bottom
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.base,
    justifyContent: 'space-between',
  },
  cardOverlayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: '#fff',
  },
  cardTitleLead: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.4,
    color: '#fff',
  },
  cardHookOverlay: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 6,
  },
  sourceOverlay: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    flexShrink: 1,
    marginTop: 10,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  reasonGlyph: {
    fontSize: 10,
    color: Colors.gold,
  },
  reasonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(205,168,106,0.9)',
  },
  swipeHint: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.gold,
    marginTop: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  // ─── Stream label (LATEST divider) ─────────────────────────────────────────
  streamLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  streamLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streamLabelText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: Colors.textSecondary,
  },
  streamCaret: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  streamRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.hairlineGold,
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
