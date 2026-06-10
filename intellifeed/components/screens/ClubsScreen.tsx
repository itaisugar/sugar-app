import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { CLUBS, Club, clubFaces, clubActiveNow, clubChallenge } from '../../constants/MockData';
import { getCategoryStyle } from '../../constants/Categories';
import { DEMO_MODE } from '../../constants/flags';
import { Beta } from '../../constants/Copy';
import { useProfile } from '../../lib/ProfileContext';
import { fetchJoinedClubIds, joinClub, leaveClub, fetchJoinedClubsActivity } from '../../lib/clubs';
import { Tappable, ZoomImage, CatTag, GoldBadge, MemberFaces, MemberMeter, LivePulse, EntranceView } from '../ui';

type Snippet = { who: string; body: string };

// Mock fallback discussion snippets, used when a club has no real comments yet.
const MOCK_SNIPPETS: Snippet[] = [
  { who: 'Elena V.', body: '"Chapter 4 reframed how I think about deliberate practice entirely."' },
  { who: 'Marcus T.', body: '"Anyone else struck by the parallels to Kahneman here?"' },
  { who: 'Priya N.', body: '"Started the protocol Monday — three days in and sleeping better already."' },
  { who: 'James L.', body: '"The footnote on page 211 is worth the price of admission alone."' },
];

// ── Challenge progress strip ────────────────────────────────────────────────
function ChallengeProgress({ club }: { club: Club }) {
  if (!club.currentChallenge) return null;
  // Beta: the challenge prompt is real curated content, but the "Day X / Y"
  // progress and fill are fabricated — so we show the prompt without them.
  if (!DEMO_MODE) {
    return (
      <View style={styles.challengeBox}>
        <Text style={styles.challengeLabel}>THIS WEEK'S FOCUS</Text>
        <Text style={[styles.challengeText, { marginTop: 8 }]} numberOfLines={2}>{club.currentChallenge}</Text>
      </View>
    );
  }
  const ch = clubChallenge(club);
  if (!ch) return null;
  const pct = Math.max(0.04, Math.min(1, ch.day / ch.total));
  return (
    <View style={styles.challengeBox}>
      <View style={styles.challengeTop}>
        <Text style={styles.challengeLabel}>THIS WEEK'S CHALLENGE</Text>
        <Text style={styles.challengeDay}>Day {ch.day} / {ch.total}</Text>
      </View>
      <Text style={styles.challengeText} numberOfLines={2}>{club.currentChallenge}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

// ── Join / Joined pill ──────────────────────────────────────────────────────
function JoinButton({ joined, onPress, full = false }: { joined: boolean; onPress: () => void; full?: boolean }) {
  return (
    <Tappable onPress={onPress} style={[styles.joinBtn, full && styles.joinBtnFull, joined && styles.joinBtnJoined]}>
      <Text style={[styles.joinIcon, joined && styles.joinTextJoined]}>{joined ? '✓' : '+'}</Text>
      <Text style={[styles.joinText, joined && styles.joinTextJoined]}>{joined ? 'Joined' : 'Join'}</Text>
    </Tappable>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{text}</Text>
      <View style={styles.sectionRule} />
    </View>
  );
}

// ── Joined "membership" card ────────────────────────────────────────────────
function JoinedClubCard({ club, snippet, onOpen, onToggle }: { club: Club; snippet: Snippet | null; onOpen: () => void; onToggle: () => void }) {
  const faces = clubFaces(club);
  return (
    <Tappable onPress={onOpen} style={styles.membershipCard}>
      <View style={styles.membershipTop}>
        <ZoomImage source={{ uri: club.image }} style={styles.thumb} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.membershipMetaRow}>
            <CatTag category={club.category} onDark={false} small />
            {DEMO_MODE ? <LivePulse label={`${clubActiveNow(club)} active now`} /> : null}
          </View>
          <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
          <View style={styles.facesRow}>
            {DEMO_MODE ? (
              <>
                <MemberFaces faces={faces} size={21} ring={Colors.surface} />
                <Text style={styles.facesCount}>{club.members.toLocaleString()} members</Text>
              </>
            ) : (
              <Text style={styles.betaTag}>{Beta.foundingCircle}</Text>
            )}
          </View>
        </View>
      </View>

      {snippet ? (
        <View style={styles.snippetRow}>
          <Text style={styles.snippetGlyph}>❝</Text>
          <Text style={styles.snippetText} numberOfLines={2}>
            <Text style={styles.snippetWho}>{snippet.who}</Text>{'  '}{snippet.body}
          </Text>
        </View>
      ) : null}

      <ChallengeProgress club={club} />
    </Tappable>
  );
}

// ── Spotlight (featured) discover card ──────────────────────────────────────
function SpotlightClub({ club, joined, onOpen, onToggle }: { club: Club; joined: boolean; onOpen: () => void; onToggle: () => void }) {
  const tint = getCategoryStyle(club.category).gradientEnd;
  const faces = clubFaces(club);
  return (
    <Tappable onPress={onOpen} style={[styles.spotlightCard]}>
      <ZoomImage source={{ uri: club.image }} style={styles.spotlightHero}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(8,7,9,0.12)', 'rgba(8,7,9,0.42)', tint + '2E', 'rgba(8,7,9,0.95)']}
          locations={[0, 0.46, 0.72, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.spotlightOverlay}>
          <View style={styles.cardOverlayTop}>
            <CatTag category={club.category} onDark />
            <GoldBadge label="Featured" />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={styles.spotlightName} numberOfLines={2}>{club.name}</Text>
            <Text style={styles.spotlightDesc} numberOfLines={1}>{club.description}</Text>
            <View style={styles.spotlightFooter}>
              {DEMO_MODE ? (
                <View style={styles.facesRow}>
                  <MemberFaces faces={faces} size={22} ring="rgba(8,7,9,0.9)" onDark />
                  <Text style={styles.facesCountOnDark}>{club.members.toLocaleString()} members</Text>
                </View>
              ) : (
                <Text style={styles.facesCountOnDark}>{Beta.beFirst}</Text>
              )}
              <JoinButton joined={joined} onPress={onToggle} />
            </View>
          </View>
        </View>
      </ZoomImage>
    </Tappable>
  );
}

// ── Discover club card ──────────────────────────────────────────────────────
function DiscoverClubCard({ club, joined, onOpen, onToggle }: { club: Club; joined: boolean; onOpen: () => void; onToggle: () => void }) {
  const tint = getCategoryStyle(club.category).gradientEnd;
  const faces = clubFaces(club);
  return (
    <Tappable onPress={onOpen} style={styles.discoverCard}>
      <ZoomImage source={{ uri: club.image }} style={styles.discoverHero}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(8,7,9,0.05)', tint + '22', 'rgba(8,7,9,0.92)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.discoverHeroOverlay}>
          <CatTag category={club.category} onDark />
          <Text style={styles.discoverName} numberOfLines={1}>{club.name}</Text>
        </View>
      </ZoomImage>
      <View style={styles.discoverBody}>
        <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>
        <View style={styles.discoverMetaRow}>
          {DEMO_MODE ? (
            <>
              <View style={styles.facesRow}>
                <MemberFaces faces={faces} size={20} ring={Colors.surface} />
                <Text style={styles.facesCount}>{club.members.toLocaleString()}</Text>
              </View>
              <MemberMeter percent={club.weeklyActivity} />
            </>
          ) : (
            <Text style={styles.betaTag}>{Beta.foundingCircle}</Text>
          )}
        </View>
        <JoinButton joined={joined} onPress={onToggle} full />
      </View>
    </Tappable>
  );
}

export default function ClubsScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [snippets, setSnippets] = useState<Record<string, Snippet>>({});

  const refresh = useCallback(async () => {
    const [ids, activity] = await Promise.all([fetchJoinedClubIds(), fetchJoinedClubsActivity(20)]);
    setJoinedIds(ids);
    const map: Record<string, Snippet> = {};
    for (const a of activity) {
      if (!map[a.club_id]) map[a.club_id] = { who: a.author_name ?? 'A reader', body: a.body };
    }
    setSnippets(map);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const clubs: Club[] = CLUBS.map(c => ({
    ...c,
    isJoined: joinedIds.has(c.id),
    members: c.members + (joinedIds.has(c.id) && !c.isJoined ? 1 : 0),
  }));

  const joined = clubs.filter(c => c.isJoined);
  const discover = clubs.filter(c => !c.isJoined);

  const snippetFor = (club: Club): Snippet | null => {
    // Real discussion activity from clubs the user is in.
    if (snippets[club.id]) return snippets[club.id];
    // Demo Mode only: a stable mock snippet so cards feel alive in screenshots.
    if (DEMO_MODE) {
      const seed = club.id.charCodeAt(club.id.length - 1);
      return MOCK_SNIPPETS[seed % MOCK_SNIPPETS.length];
    }
    return null;
  };

  const openClub = (id: string) => router.push({ pathname: '/club/[id]', params: { id } });

  const toggleJoin = async (club: Club) => {
    const next = new Set(joinedIds);
    if (club.isJoined) {
      next.delete(club.id);
      setJoinedIds(next);
      try { await leaveClub(club.id); } catch { /* revert on failure */ setJoinedIds(prev => new Set(prev).add(club.id)); }
    } else {
      next.add(club.id);
      setJoinedIds(next);
      try { await joinClub(club.id); } catch { setJoinedIds(prev => { const s = new Set(prev); s.delete(club.id); return s; }); }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <EntranceView>
          {/* Header */}
          <View style={styles.header}>
            <Text style={TextStyles.overline}>COMMUNITIES OF PRACTICE</Text>
            <Text style={[TextStyles.screenTitle, { marginTop: 6 }]}>
              Clubs<Text style={{ color: Colors.primary }}>.</Text>
            </Text>
            <Text style={styles.subtitle}>Read alongside people who push you.</Text>
          </View>

          {joined.length > 0 ? (
            <>
              <SectionLabel text={`Your Clubs · ${joined.length}`} />
              <View style={{ gap: 16 }}>
                {joined.map(c => (
                  <JoinedClubCard
                    key={c.id}
                    club={c}
                    snippet={snippetFor(c)}
                    onOpen={() => openClub(c.id)}
                    onToggle={() => toggleJoin(c)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {discover.length > 0 ? (
            <>
              <SectionLabel text="Discover" />
              <View style={{ gap: 16 }}>
                {discover.map((c, i) =>
                  i === 0 ? (
                    <SpotlightClub key={c.id} club={c} joined={c.isJoined} onOpen={() => openClub(c.id)} onToggle={() => toggleJoin(c)} />
                  ) : (
                    <DiscoverClubCard key={c.id} club={c} joined={c.isJoined} onOpen={() => openClub(c.id)} onToggle={() => toggleJoin(c)} />
                  ),
                )}
              </View>
            </>
          ) : null}
        </EntranceView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: 18 },

  // Header
  header: { paddingTop: Spacing.sm },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  // Section labels
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  sectionLabelText: {
    fontFamily: Fonts.display,
    fontSize: 16,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: Colors.border },

  // ── Membership (joined) card ──
  membershipCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    ...Shadow.sm,
  },
  membershipTop: { flexDirection: 'row', gap: 14 },
  membershipMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  thumb: { width: 60, height: 60, borderRadius: Radius.lg },
  clubName: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  facesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  facesCount: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.textMuted },
  facesCountOnDark: { fontFamily: Fonts.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  // Beta-honest social-proof label, in the gold accent (replaces fake counts).
  betaTag: { fontFamily: Fonts.sansSemibold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.gold },

  // Discussion snippet
  snippetRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  snippetGlyph: { fontSize: 14, color: Colors.textFaint, lineHeight: 18 },
  snippetText: { flex: 1, fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 18, color: Colors.textMuted },
  snippetWho: { fontFamily: Fonts.sansSemibold, color: Colors.textSecondary },

  // Challenge
  challengeBox: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.hairlineGold,
    gap: 8,
  },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeLabel: { fontFamily: Fonts.sansSemibold, fontSize: 9.5, letterSpacing: 1.4, color: Colors.textSecondary },
  challengeDay: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.primary },
  challengeText: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 18, color: Colors.textPrimary },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(244,241,236,0.1)', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: Colors.primary },

  // ── Spotlight ──
  spotlightCard: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.hairlineGold,
    ...Shadow.glow,
  },
  spotlightHero: { width: '100%', height: 196 },
  spotlightOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.base, justifyContent: 'space-between' },
  cardOverlayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spotlightName: { fontFamily: Fonts.display, fontSize: 23, lineHeight: 27, letterSpacing: -0.3, color: '#fff' },
  spotlightDesc: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  spotlightFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },

  // ── Discover card ──
  discoverCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  discoverHero: { width: '100%', height: 118 },
  discoverHeroOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.md, justifyContent: 'space-between', alignItems: 'flex-start' },
  discoverName: { fontFamily: Fonts.display, fontSize: 18, letterSpacing: -0.2, color: '#fff' },
  discoverBody: { padding: Spacing.base, gap: 12 },
  clubDesc: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  discoverMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },

  // ── Join button ──
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  joinBtnFull: { paddingVertical: 12, alignSelf: 'stretch' },
  joinBtnJoined: { backgroundColor: Colors.transparent, borderWidth: 1, borderColor: Colors.borderStrong },
  joinIcon: { fontFamily: Fonts.sansBold, fontSize: 13, color: Colors.onPrimary, lineHeight: 16 },
  joinText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.onPrimary },
  joinTextJoined: { color: Colors.textSecondary },
});
