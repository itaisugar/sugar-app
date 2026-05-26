import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../../constants/Theme';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';

function deriveTier(score: number): string {
  if (score >= 5000) return 'Grand Master';
  if (score >= 3000) return 'Master Learner';
  if (score >= 1500) return 'Expert Learner';
  if (score >= 500) return 'Devoted Reader';
  if (score >= 100) return 'Engaged Reader';
  return 'New Reader';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile: dbProfile, loading: profileLoading, error: profileError, refresh } = useProfile();
  const [activeSection, setActiveSection] = useState<'stats' | 'knowledge' | 'badges'>('stats');
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  // Loading state — only when we have no profile yet
  if (profileLoading && !dbProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.statusText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (profileError && !dbProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Couldn't load your profile</Text>
          <Text style={styles.statusText}>{profileError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state — authenticated but no profile row found (rare; trigger should always create one)
  if (!dbProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>No profile found</Text>
          <Text style={styles.statusText}>
            Your profile hasn't been initialized yet. Please sign out and sign back in.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={signOut}>
            <Text style={styles.retryBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Derived display values — strictly from the authenticated user's DB row
  const displayEmail = dbProfile.email ?? user?.email ?? '';
  const displayName = dbProfile.full_name ?? 'Reader';
  const userInterests = dbProfile.interests?.length ? dbProfile.interests : null;
  const memberSince = dbProfile.created_at
    ? new Date(dbProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';
  const dobFormatted = dbProfile.date_of_birth
    ? new Date(dbProfile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const totalScore = dbProfile.total_score ?? 0;
  const weeklyStreak = dbProfile.weekly_streak ?? 0;
  const articlesRead = dbProfile.articles_read ?? 0;
  const podcastsListened = dbProfile.podcasts_listened ?? 0;
  const booksCompleted = dbProfile.books_completed ?? 0;
  const plansCompleted = dbProfile.plans_completed ?? 0;
  const following = dbProfile.following ?? 0;
  const followers = dbProfile.followers ?? 0;

  // Tier progress — derived from total_score
  const nextTierTarget = Math.max(1000, Math.ceil((totalScore + 1) / 1000) * 1000);
  const tierProgressPct = Math.min(100, Math.round((totalScore / nextTierTarget) * 100));
  const pointsToNextTier = Math.max(0, nextTierTarget - totalScore);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={TextStyles.kicker}>Your Knowledge Tree</Text>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(displayName ?? displayEmail ?? 'I').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[TextStyles.screenTitle, { marginTop: Spacing.base }]}>{displayName}</Text>
          <Text style={styles.heroEmail}>{displayEmail}</Text>
          <Text style={styles.heroJoined}>Member since {memberSince}</Text>
          {dobFormatted ? (
            <Text style={styles.heroDob}>Born {dobFormatted}</Text>
          ) : null}
          <Text style={[TextStyles.tagline, { marginTop: 12, marginBottom: Spacing.lg }]}>
            Track your intellectual evolution.
          </Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.followRow}>
            <View style={styles.followItem}>
              <Text style={styles.followNumber}>{following}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followNumber}>{followers}</Text>
              <Text style={styles.followLabel}>Followers</Text>
            </View>
          </View>
        </View>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMain}>
            <Text style={styles.scoreOverline}>CUMULATIVE SCORE</Text>
            <Text style={TextStyles.displayNumber}>{totalScore.toLocaleString()}</Text>
          </View>
          <View style={styles.scoreDetails}>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailNum}>{weeklyStreak}</Text>
              <Text style={styles.scoreDetailLabel}>Day Streak</Text>
            </View>
            <View style={styles.scoreDetailDivider} />
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailNum}>{articlesRead}</Text>
              <Text style={styles.scoreDetailLabel}>Articles</Text>
            </View>
            <View style={styles.scoreDetailDivider} />
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailNum}>{podcastsListened}</Text>
              <Text style={styles.scoreDetailLabel}>Podcasts</Text>
            </View>
          </View>
        </View>

        {/* Level */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelOverline}>CURRENT TIER</Text>
              <Text style={styles.levelTitle}>{deriveTier(totalScore)}</Text>
            </View>
            <Text style={styles.levelNextText}>
              {pointsToNextTier === 0 ? 'Max tier' : `${pointsToNextTier.toLocaleString()} points to next tier`}
            </Text>
          </View>
          <View style={styles.levelBar}>
            <View style={[styles.levelBarFill, { width: `${tierProgressPct}%` }]} />
          </View>
          <View style={styles.levelMarkers}>
            <Text style={styles.levelMarkerText}>{totalScore.toLocaleString()}</Text>
            <Text style={styles.levelMarkerText}>{nextTierTarget.toLocaleString()}</Text>
          </View>
        </View>

        {/* Section tabs */}
        <View style={styles.sectionTabs}>
          {[
            { key: 'stats', label: 'Statistics' },
            { key: 'knowledge', label: 'Knowledge' },
            { key: 'badges', label: 'Distinctions' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.sectionTab, activeSection === tab.key && styles.sectionTabActive]}
              onPress={() => setActiveSection(tab.key as any)}
            >
              <Text style={[styles.sectionTabText, activeSection === tab.key && styles.sectionTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeSection === 'stats' && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              {[
                { value: articlesRead, label: 'Articles Consumed' },
                { value: podcastsListened, label: 'Podcasts Engaged' },
                { value: booksCompleted, label: 'Books Completed' },
                { value: plansCompleted, label: 'Plans Executed' },
              ].map(stat => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={TextStyles.statNumberLarge}>{stat.value}</Text>
                  <Text style={[TextStyles.statLabel, { textAlign: 'center', marginTop: 4 }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.interestsCard}>
              <Text style={styles.interestsOverline}>DOMAINS OF INTEREST</Text>
              {userInterests ? (
                <View style={styles.interestsList}>
                  {userInterests.map(interest => (
                    <View key={interest} style={styles.interestPill}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.interestEmpty}>
                  No interests selected yet. Complete onboarding to personalize your feed.
                </Text>
              )}
            </View>
          </View>
        )}

        {activeSection === 'knowledge' && (
          <View style={styles.section}>
            <Text style={TextStyles.sectionTitle}>Your Knowledge Tree</Text>
            <Text style={[TextStyles.tagline, { marginTop: 4 }]}>
              An evolving map of your intellectual depth.
            </Text>
            <TouchableOpacity style={styles.sectionEmpty} onPress={() => router.push('/tree')} activeOpacity={0.85}>
              <Text style={TextStyles.emptyTitle}>Open your canopy</Text>
              <Text style={[TextStyles.emptyDescription, { textAlign: 'center' }]}>
                A radial view of every domain you've engaged with. Tap to enter.
              </Text>
              <View style={styles.openTreeBtn}>
                <Text style={TextStyles.buttonSecondary}>Open tree  →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'badges' && (
          <View style={styles.section}>
            <Text style={TextStyles.sectionTitle}>Distinctions Earned</Text>
            <Text style={[TextStyles.tagline, { marginTop: 4 }]}>
              Markers of consistent intellectual practice.
            </Text>
            <View style={styles.sectionEmpty}>
              <Text style={TextStyles.emptyTitle}>No distinctions yet</Text>
              <Text style={[TextStyles.emptyDescription, { textAlign: 'center' }]}>
                Sustained practice unlocks recognitions for depth of reading, breadth of interests,
                and consistency. Yours will appear here as you progress.
              </Text>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.settingsCard}>
          {([
            ...(dbProfile.is_admin
              ? [{ label: 'Editorial Desk', onPress: () => router.push('/admin') }]
              : []),
            { label: 'Account Settings', onPress: () => {} },
            { label: 'Notifications', onPress: () => {} },
            { label: 'Refine Interests', onPress: () => router.push('/edit-profile') },
          ]).map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={[styles.settingsRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Text style={styles.settingsChevron}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sapiens · Upgrade Your Cognitive Diet</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  retryBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemibold,
    color: Colors.white,
    letterSpacing: 0.6,
  },

  heroDob: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  editBtn: {
    marginTop: Spacing.base,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.transparent,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  sectionEmpty: {
    marginTop: 16,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  openTreeBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  sectionEmptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
  },
  sectionEmptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },


  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  kicker: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: Spacing.base,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.base,
  },
  avatarText: {
    fontSize: 42,
    fontFamily: Fonts.serif,
    color: Colors.primary,
  },
  heroName: {
    fontSize: 30,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  heroJoined: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: Spacing.lg,
  },
  followRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    gap: 32,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  followItem: { alignItems: 'center' },
  followNumber: {
    fontSize: 22,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
  },
  followLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  followDivider: { width: 1, backgroundColor: Colors.surfaceBorder },

  // Score
  scoreCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  scoreMain: {
    alignItems: 'center',
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  scoreOverline: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  scoreBig: {
    fontSize: 48,
    fontFamily: Fonts.serif,
    color: Colors.primary,
    letterSpacing: -1,
  },
  scoreDetails: {
    flexDirection: 'row',
    paddingTop: Spacing.base,
  },
  scoreDetail: { flex: 1, alignItems: 'center' },
  scoreDetailNum: {
    fontSize: 18,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
  },
  scoreDetailLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scoreDetailDivider: { width: 1, backgroundColor: Colors.surfaceBorder },

  // Level
  levelCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  levelOverline: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
  },
  levelNextText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  levelBar: {
    height: 3,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  levelMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  levelMarkerText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  sectionTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    gap: 8,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  sectionTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  sectionTabText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTabTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.serifItalic,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  statValue: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  interestsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  interestsOverline: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 14,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  interestText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  interestEmpty: {
    fontSize: 13,
    fontFamily: Fonts.serifItalic,
    color: Colors.textMuted,
    lineHeight: 20,
  },

  knowledgeNode: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  knowledgeNodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  knowledgeNodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  knowledgeNodeLabel: {
    fontSize: 18,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  knowledgeNodeScore: {
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  knowledgeBar: {
    height: 3,
    backgroundColor: Colors.background,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  knowledgeBarFill: { height: 3, borderRadius: 2 },
  expandChevron: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
    color: Colors.primary,
  },
  knowledgeChildren: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: 14,
  },
  knowledgeChildRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  knowledgeChildHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  knowledgeChildLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  knowledgeChildScore: {
    fontSize: 13,
    fontFamily: Fonts.sansSemibold,
  },

  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  badgeCardLocked: {
    backgroundColor: Colors.transparent,
    borderStyle: 'dashed',
  },
  badgeIcon: {
    fontSize: 28,
    color: Colors.primary,
  },
  badgeName: {
    fontSize: 14,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDate: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  badgeLockedLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },

  settingsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  settingsChevron: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
  },
  signOutBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemibold,
    color: '#DC2626',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  footerText: {
    fontSize: 11,
    fontFamily: Fonts.serifItalic,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
