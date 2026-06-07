import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { Tappable, EntranceView, ProgressRing, Progress } from '../ui';
import { getCategoryStyle } from '../../constants/Categories';
import { USER_PROFILE, KnowledgeNode } from '../../constants/MockData';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';
import { fetchSavedItems } from '../../lib/saved';
import { FeedItem } from '../../lib/content';

const DOMAIN_COLORS = ['#12B886', '#4D8DF6', '#E0962B', '#13B6CC'];

const TIERS = [
  { min: 0, label: 'New Reader' },
  { min: 100, label: 'Engaged Reader' },
  { min: 500, label: 'Devoted Reader' },
  { min: 1500, label: 'Expert Learner' },
  { min: 3000, label: 'Master Learner' },
  { min: 5000, label: 'Grand Master' },
];
function tierFor(score: number) {
  let cur = TIERS[0], next = TIERS[TIERS.length - 1];
  for (let i = 0; i < TIERS.length; i++) {
    if (score >= TIERS[i].min) { cur = TIERS[i]; next = TIERS[i + 1] ?? TIERS[i]; }
  }
  const nextAt = next.min > cur.min ? next.min : cur.min;
  return { tier: cur.label, nextTier: next.label, nextTierAt: nextAt, maxed: next.min === cur.min };
}

// ── Concentric "Cognitive Map" rings ────────────────────────────────────────
function KnowledgeRings({ domains }: { domains: KnowledgeNode[] }) {
  const size = 168, c = size / 2;
  const stroke = 11, gap = 5.5, outer = size / 2 - stroke / 2 - 2;
  const avg = Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length);
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          {domains.map((d, i) => {
            const r = outer - i * (stroke + gap);
            const circ = 2 * Math.PI * r;
            const col = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
            return (
              <React.Fragment key={i}>
                <Circle cx={c} cy={c} r={r} fill="none" stroke={col} strokeOpacity={0.16} strokeWidth={stroke} />
                <Circle cx={c} cy={c} r={r} fill="none" stroke={col} strokeWidth={stroke}
                  strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - d.score / 100)} />
              </React.Fragment>
            );
          })}
        </Svg>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.ringIndex}>{avg}</Text>
          <Text style={styles.ringIndexLabel}>COGNITIVE INDEX</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {domains.map((d, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.legendScore}>{d.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Domain breakdown row ────────────────────────────────────────────────────
function DomainRow({ node, color, defaultOpen }: { node: KnowledgeNode; color: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const children = node.children ?? [];
  return (
    <View style={[styles.card, { padding: 0 }]}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 3, backgroundColor: color }} />
        <View style={{ flex: 1, padding: Spacing.base }}>
          <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <ProgressRing pct={node.score} size={44} stroke={3.5} color={color} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.domainLabel}>{node.label}</Text>
              <Text style={styles.domainSub}>{children.length} areas tracked</Text>
            </View>
            <Text style={styles.chev}>{open ? '⌄' : '›'}</Text>
          </TouchableOpacity>
          {open ? (
            <View style={styles.domainChildren}>
              {children.map(ch => (
                <View key={ch.id ?? ch.label}>
                  <View style={styles.domainChildHead}>
                    <Text style={styles.domainChildLabel}>{ch.label}</Text>
                    <Text style={[styles.domainChildScore, { color }]}>{ch.score}</Text>
                  </View>
                  <Progress pct={ch.score} color={color} height={3} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile: dbProfile, loading: profileLoading, error: profileError, refresh } = useProfile();
  const [tab, setTab] = useState<'stats' | 'knowledge' | 'saved'>('stats');
  const [signingOut, setSigningOut] = useState(false);
  const [savedItems, setSavedItems] = useState<FeedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'saved') return;
    (async () => {
      setSavedLoading(true);
      try { setSavedItems(await fetchSavedItems()); } catch {} finally { setSavedLoading(false); }
    })();
  }, [tab]);

  if (profileLoading && !dbProfile) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator color={Colors.primary} /><Text style={styles.statusText}>Loading your profile…</Text></View></SafeAreaView>;
  }
  if (profileError && !dbProfile) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={TextStyles.emptyTitle}>Couldn't load your profile</Text><Text style={styles.statusText}>{profileError}</Text><TouchableOpacity style={styles.retryBtn} onPress={refresh}><Text style={styles.retryBtnText}>Try Again</Text></TouchableOpacity></View></SafeAreaView>;
  }
  if (!dbProfile) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={TextStyles.emptyTitle}>No profile found</Text><Text style={styles.statusText}>Please sign out and sign back in.</Text><TouchableOpacity style={styles.retryBtn} onPress={signOut}><Text style={styles.retryBtnText}>Sign Out</Text></TouchableOpacity></View></SafeAreaView>;
  }

  const displayName = dbProfile.full_name ?? 'Reader';
  const displayEmail = dbProfile.email ?? user?.email ?? '';
  const initial = (displayName || displayEmail || 'I').charAt(0).toUpperCase();
  const handle = displayEmail ? `@${displayEmail.split('@')[0]}` : '@reader';
  const bio = (dbProfile as any).bio ?? 'Building a deliberate cognitive diet — reading at the intersection of medicine, machines, and the mind.';

  const totalScore = dbProfile.total_score ?? 0;
  const { tier, nextTier, nextTierAt, maxed } = tierFor(totalScore);
  const tierPct = maxed ? 100 : Math.min(100, Math.round((totalScore / nextTierAt) * 100));
  const pointsToNext = Math.max(0, nextTierAt - totalScore);

  const streak = dbProfile.weekly_streak ?? dbProfile.day_streak ?? 0;
  const articlesRead = dbProfile.articles_read ?? 0;
  const podcasts = dbProfile.podcasts_listened ?? 0;
  const books = dbProfile.books_completed ?? 0;
  const plansCompleted = dbProfile.plans_completed ?? 0;
  const following = dbProfile.following ?? 0;
  const followers = dbProfile.followers ?? 0;
  const interests = dbProfile.interests?.length ? dbProfile.interests : null;

  const knowledge = USER_PROFILE.knowledgeTree;
  const badges = USER_PROFILE.badges;
  const saved = savedItems;

  const Stat = ({ n, l }: { n: number | string; l: string }) => (
    <View style={styles.statTile}>
      <Text style={styles.statTileNum}>{n}</Text>
      <Text style={styles.statTileLabel}>{l}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <EntranceView>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={[Colors.gold, Colors.primary, Colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
              <View style={styles.avatarInner}><Text style={styles.avatarText}>{initial}</Text></View>
            </LinearGradient>
            <Text style={styles.heroName}>{displayName}</Text>
            <View style={styles.tierChip}>
              <Text style={{ color: Colors.gold, fontSize: 11 }}>◆</Text>
              <Text style={styles.tierChipText}>{tier}</Text>
            </View>
            <Text style={styles.handle}>{handle}</Text>
            <Text style={styles.bio}>{bio}</Text>
            <View style={styles.followRow}>
              <Text style={styles.followItem}><Text style={styles.followNum}>{following}</Text> <Text style={styles.followLabel}>Following</Text></Text>
              <View style={styles.followDivider} />
              <Text style={styles.followItem}><Text style={styles.followNum}>{followers}</Text> <Text style={styles.followLabel}>Followers</Text></Text>
              <View style={styles.followDivider} />
              <TouchableOpacity onPress={() => router.push('/edit-profile')}><Text style={styles.editLink}>Edit</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.body}>
            {/* Membership card */}
            <View style={styles.membershipCard}>
              <View style={styles.membershipGlow} pointerEvents="none" />
              <View style={styles.membershipTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goldKicker, { marginBottom: 8 }]}>CUMULATIVE SCORE</Text>
                  <Text style={styles.scoreBig}>{totalScore.toLocaleString()}</Text>
                  <Text style={styles.toNext}>
                    {maxed ? 'Top tier reached' : <>{pointsToNext.toLocaleString()} points to <Text style={{ color: Colors.gold, fontFamily: Fonts.sansSemibold }}>{nextTier}</Text></>}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <ProgressRing pct={tierPct} size={70} stroke={5} color={Colors.gold} />
                  <Text style={[styles.faintKicker, { marginTop: 7 }]}>TO NEXT TIER</Text>
                </View>
              </View>
              <View style={styles.statStrip}>
                {([['Streak', `${streak}d`], ['Articles', articlesRead], ['Podcasts', podcasts], ['Books', books]] as [string, any][]).map(([l, n], i) => (
                  <React.Fragment key={l}>
                    {i > 0 ? <View style={styles.statStripDivider} /> : null}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.statStripNum}>{n}</Text>
                      <Text style={styles.statStripLabel}>{l.toUpperCase()}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {([['stats', 'Overview'], ['knowledge', 'Knowledge'], ['saved', `Saved · ${saved.length}`]] as [typeof tab, string][]).map(([k, l]) => (
                <TouchableOpacity key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'stats' ? (
              <View style={{ gap: 14 }}>
                <View style={[styles.card, { padding: Spacing.lg }]}>
                  <Text style={[styles.faintKicker, { marginBottom: 12 }]}>DOMAINS OF INTEREST</Text>
                  {interests ? (
                    <View style={styles.pillWrap}>
                      {interests.map(i => <View key={i} style={styles.interestPill}><Text style={styles.interestText}>{i}</Text></View>)}
                    </View>
                  ) : (
                    <Text style={styles.emptyInline}>No interests selected yet. Edit your profile to personalize your feed.</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Stat n={plansCompleted} l="PLANS EXECUTED" />
                  <Stat n={books} l="BOOKS COMPLETED" />
                </View>
                <View style={[styles.card, { padding: Spacing.lg }]}>
                  <Text style={[styles.faintKicker, { marginBottom: 14 }]}>ACHIEVEMENTS</Text>
                  <View style={styles.badgeGrid}>
                    {badges.map(b => (
                      <View key={b.id} style={styles.badge}>
                        <Text style={styles.badgeIcon}>{b.icon}</Text>
                        <Text style={styles.badgeName}>{b.name}</Text>
                        <Text style={styles.badgeDesc}>{b.description}</Text>
                        <Text style={styles.badgeDate}>{b.unlockedAt?.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {tab === 'knowledge' ? (
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.sectionTitle}>Cognitive Map</Text>
                  <Text style={styles.sectionSub}>A living map of where your attention compounds.</Text>
                </View>
                <View style={[styles.card, styles.cardGlow, { padding: Spacing.lg, alignItems: 'center' }]}>
                  <KnowledgeRings domains={knowledge} />
                </View>
                <Text style={styles.faintKicker}>BY DOMAIN</Text>
                {knowledge.map((n, i) => (
                  <DomainRow key={n.id} node={n} color={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} defaultOpen={i === 0} />
                ))}
              </View>
            ) : null}

            {tab === 'saved' ? (
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.sectionTitle}>Your Library</Text>
                  <Text style={styles.sectionSub}>Everything you've marked to return to.</Text>
                </View>
                {savedLoading && saved.length === 0 ? (
                  <View style={styles.savedEmpty}><ActivityIndicator color={Colors.primary} /></View>
                ) : saved.length === 0 ? (
                  <View style={styles.savedEmpty}>
                    <Text style={styles.savedEmptyTitle}>Nothing saved yet</Text>
                    <Text style={styles.savedEmptyText}>Tap the bookmark on any piece to file it here.</Text>
                  </View>
                ) : (
                  saved.map(item => (
                    <Tappable key={item.id} style={styles.savedRow} onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}>
                      {item.image ? <Image source={{ uri: item.image }} style={styles.savedThumb} /> : <View style={[styles.savedThumb, { backgroundColor: Colors.surfaceMuted }]} />}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.savedCat, { color: getCategoryStyle(item.category).color }]}>{item.category.toUpperCase()}</Text>
                        <Text style={styles.savedTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.savedMeta}>{item.source} · {item.readTime} min</Text>
                      </View>
                    </Tappable>
                  ))
                )}
              </View>
            ) : null}

            {/* Settings */}
            <View style={[styles.card, { overflow: 'hidden' }]}>
              {([
                ...(dbProfile.is_admin ? [{ label: 'Editorial Desk', onPress: () => router.push('/admin') }] : []),
                { label: 'Account Settings', onPress: () => {} },
                { label: 'Notifications', onPress: () => {} },
                { label: 'Refine Interests', onPress: () => router.push('/edit-profile') },
              ]).map((it, i, arr) => (
                <TouchableOpacity key={it.label} onPress={it.onPress} style={[styles.settingsRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.settingsLabel}>{it.label}</Text>
                  <Text style={styles.settingsChev}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={async () => { setSigningOut(true); await signOut(); }} disabled={signingOut} activeOpacity={0.7}>
              <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>Sapience<Text style={{ color: Colors.primary }}>.</Text> · Upgrade your cognitive diet</Text>
          </View>
        </EntranceView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 12 },
  statusText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary },
  retryBtnText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.onPrimary, letterSpacing: 0.6 },

  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.base, gap: 14 },

  // Card shell
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardGlow: { borderColor: Colors.hairlineGold, ...Shadow.glow },

  goldKicker: { fontFamily: Fonts.sansSemibold, fontSize: 10.5, letterSpacing: 1.8, textTransform: 'uppercase', color: Colors.gold },
  faintKicker: { fontFamily: Fonts.sansSemibold, fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textFaint },

  // Hero
  hero: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: 52, paddingBottom: Spacing.sm },
  avatarRing: { padding: 4, borderRadius: 999 },
  avatarInner: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.background,
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 40, color: Colors.onPrimary },
  heroName: { fontFamily: Fonts.display, fontSize: 24, letterSpacing: -0.4, color: Colors.textPrimary, marginTop: 14 },
  tierChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.hairlineGold,
  },
  tierChipText: { fontFamily: Fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.gold },
  handle: { fontFamily: Fonts.mono, fontSize: 11.5, color: Colors.textMuted, marginTop: 10 },
  bio: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20, color: Colors.textSecondary, marginTop: 10, textAlign: 'center', maxWidth: 300 },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
  followItem: { fontFamily: Fonts.sans },
  followNum: { fontFamily: Fonts.display, fontSize: 18, color: Colors.textPrimary },
  followLabel: { fontSize: 11, color: Colors.textMuted },
  followDivider: { width: 1, height: 16, backgroundColor: Colors.border },
  editLink: { fontFamily: Fonts.sansSemibold, fontSize: 12.5, color: Colors.primary },

  // Membership
  membershipCard: {
    position: 'relative', overflow: 'hidden', borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.hairlineGold, padding: Spacing.lg,
    backgroundColor: Colors.surfaceAlt, ...Shadow.sm,
  },
  membershipGlow: { position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: 999, backgroundColor: Colors.primarySoftStrong },
  membershipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreBig: { fontFamily: Fonts.display, fontSize: 42, color: Colors.primary, letterSpacing: -1, lineHeight: 44 },
  toNext: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  statStrip: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  statStripDivider: { width: 1, backgroundColor: Colors.border },
  statStripNum: { fontFamily: Fonts.display, fontSize: 17, color: Colors.textPrimary },
  statStripLabel: { fontFamily: Fonts.mono, fontSize: 8.5, letterSpacing: 0.6, color: Colors.textMuted, marginTop: 4 },

  // Tabs
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tabActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  tabText: { fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontFamily: Fonts.sansSemibold },

  // Overview
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  interestText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.textPrimary },
  emptyInline: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, color: Colors.textMuted },
  statTile: { flex: 1, padding: Spacing.base, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', ...Shadow.sm },
  statTileNum: { fontFamily: Fonts.display, fontSize: 28, color: Colors.primary, letterSpacing: -0.6, lineHeight: 30 },
  statTileLabel: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1, color: Colors.textMuted, marginTop: 8 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badge: { width: '47%', padding: Spacing.base, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.hairlineGold, alignItems: 'center' },
  badgeIcon: { fontSize: 26, color: Colors.gold },
  badgeName: { fontFamily: Fonts.display, fontSize: 13, color: Colors.textPrimary, marginTop: 6, textAlign: 'center' },
  badgeDesc: { fontFamily: Fonts.sans, fontSize: 10.5, lineHeight: 15, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },
  badgeDate: { fontFamily: Fonts.mono, fontSize: 8.5, letterSpacing: 1, color: Colors.gold, marginTop: 6 },

  // Section titles
  sectionTitle: { fontFamily: Fonts.display, fontSize: 22, letterSpacing: -0.4, color: Colors.textPrimary },
  sectionSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  // Knowledge rings
  ringIndex: { fontFamily: Fonts.display, fontSize: 34, letterSpacing: -0.8, color: Colors.textPrimary, lineHeight: 36 },
  ringIndexLabel: { fontFamily: Fonts.mono, fontSize: 8.5, letterSpacing: 1.5, color: Colors.textMuted, marginTop: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, width: '100%' },
  legendRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { flex: 1, fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.textSecondary },
  legendScore: { fontFamily: Fonts.mono, fontSize: 11.5, color: Colors.textPrimary },

  // Domain rows
  domainLabel: { fontFamily: Fonts.display, fontSize: 16.5, letterSpacing: -0.2, color: Colors.textPrimary },
  domainSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  chev: { fontSize: 18, color: Colors.textMuted },
  domainChildren: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  domainChildHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  domainChildLabel: { fontFamily: Fonts.sansMedium, fontSize: 12.5, color: Colors.textSecondary },
  domainChildScore: { fontFamily: Fonts.mono, fontSize: 12 },

  // Saved
  savedEmpty: { padding: 40, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.card },
  savedEmptyTitle: { fontFamily: Fonts.display, fontSize: 16, color: Colors.textPrimary },
  savedEmptyText: { fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.textMuted, textAlign: 'center' },
  savedRow: { flexDirection: 'row', gap: 13, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  savedThumb: { width: 70, height: 70, borderRadius: Radius.lg, backgroundColor: Colors.surfaceMuted },
  savedCat: { fontFamily: Fonts.sansSemibold, fontSize: 9.5, letterSpacing: 0.6 },
  savedTitle: { fontFamily: Fonts.display, fontSize: 15, lineHeight: 18, color: Colors.textPrimary, marginVertical: 3 },
  savedMeta: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted },

  // Settings
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingsLabel: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.textPrimary },
  settingsChev: { fontSize: 16, color: Colors.primary },
  signOutBtn: { marginTop: 4, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  signOutText: { fontFamily: Fonts.sansSemibold, fontSize: 13, color: Colors.danger, letterSpacing: 1, textTransform: 'uppercase' },
  footer: { fontFamily: Fonts.display, fontSize: 12, color: Colors.textFaint, textAlign: 'center', paddingVertical: 12 },
});
