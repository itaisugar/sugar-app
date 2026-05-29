import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { fetchPublicProfile, PublicProfile } from '../../lib/peers';
import { isFollowing as checkIsFollowing, followUser, unfollowUser } from '../../lib/follows';
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

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { refresh: refreshMyProfile } = useProfile();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const isSelf = !!user && user.id === id;

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPublicProfile(id!);
        setProfile(data);
        if (!isSelf && id) {
          const f = await checkIsFollowing(id);
          setFollowing(f);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Could not load this profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isSelf]);

  const toggleFollow = async () => {
    if (!profile || isSelf || followBusy) return;
    const prev = following;
    // Optimistic update
    setFollowing(!prev);
    setProfile(p => p ? { ...p, followers: p.followers + (prev ? -1 : 1) } : p);
    setFollowBusy(true);
    try {
      if (prev) await unfollowUser(profile.id);
      else await followUser(profile.id);
      // Refresh the viewer's own profile so their `following` count stays in sync
      await refreshMyProfile();
    } catch (e: any) {
      // Roll back optimistic update on failure
      setFollowing(prev);
      setProfile(p => p ? { ...p, followers: p.followers + (prev ? 1 : -1) } : p);
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Reader not found</Text>
          <Text style={[TextStyles.emptyDescription, { textAlign: 'center', marginTop: 8 }]}>
            {error ?? 'This profile may have been removed.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });
  const initial = (profile.full_name ?? '?').charAt(0).toUpperCase();
  const tier = deriveTier(profile.total_score);

  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={TextStyles.kicker}>Reader</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{profile.full_name ?? 'Reader'}</Text>
          <Text style={[TextStyles.tagline, { marginTop: 4 }]}>Member since {memberSince}</Text>

          {!isSelf ? (
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followBtnActive, followBusy && { opacity: 0.6 }]}
              onPress={toggleFollow}
              disabled={followBusy}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.followBtnText,
                following && { color: Colors.surface },
              ]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMain}>
            <Text style={TextStyles.overline}>Cumulative score</Text>
            <Text style={styles.scoreBig}>{profile.total_score.toLocaleString()}</Text>
          </View>
          <View style={styles.scoreRight}>
            <Text style={[TextStyles.tagline, { color: Colors.textMuted }]}>Tier</Text>
            <Text style={styles.tierName}>{tier}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { v: profile.articles_read, l: 'Articles' },
            { v: profile.podcasts_listened, l: 'Podcasts' },
            { v: profile.books_completed, l: 'Books' },
            { v: profile.plans_completed, l: 'Plans' },
          ].map(s => (
            <View key={s.l} style={styles.statCell}>
              <Text style={styles.statNum}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Follow stats */}
        <View style={styles.followStats}>
          <View style={styles.followStat}>
            <Text style={styles.followStatNum}>{profile.following}</Text>
            <Text style={styles.followStatLabel}>Following</Text>
          </View>
          <View style={styles.followStatDivider} />
          <View style={styles.followStat}>
            <Text style={styles.followStatNum}>{profile.followers}</Text>
            <Text style={styles.followStatLabel}>Followers</Text>
          </View>
          <View style={styles.followStatDivider} />
          <View style={styles.followStat}>
            <Text style={styles.followStatNum}>{profile.weekly_streak}</Text>
            <Text style={styles.followStatLabel}>Day streak</Text>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.interestsBlock}>
          <Text style={[TextStyles.overline, { marginBottom: 12 }]}>Domains of interest</Text>
          {profile.interests.length > 0 ? (
            <View style={styles.interestsRow}>
              {profile.interests.map(i => (
                <View key={i} style={styles.interestPill}>
                  <Text style={styles.interestText}>{i}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={TextStyles.tagline}>
              This reader hasn't selected interests yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Text style={styles.iconBtnText}>←</Text>
      </TouchableOpacity>
      <Text style={TextStyles.overline}>Profile</Text>
      <View style={styles.iconBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 6 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18, color: Colors.textPrimary },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16,
    ...Shadow.md,
  },
  avatarText: {
    fontFamily: Fonts.serifItalicMedium,
    fontSize: 44,
    color: Colors.surface,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 18,
  },
  followBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followBtnActive: {
    backgroundColor: Colors.primary,
  },
  followBtnText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.primary,
  },

  scoreCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  scoreMain: { flex: 1 },
  scoreBig: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -1,
    color: Colors.textPrimary,
    marginTop: 6,
  },
  scoreRight: { alignItems: 'flex-end' },
  tierName: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.primary,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    gap: 10,
  },
  statCell: {
    width: '47%',
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textFaint,
    marginTop: 4,
  },

  followStats: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  followStat: { flex: 1, alignItems: 'center' },
  followStatNum: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  followStatLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textFaint,
    marginTop: 4,
  },
  followStatDivider: {
    width: 0.5,
    backgroundColor: Colors.surfaceBorder,
  },

  interestsBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.surface,
  },
  interestText: {
    fontFamily: Fonts.serifRegular,
    fontSize: 13,
    color: Colors.textPrimary,
  },
});
