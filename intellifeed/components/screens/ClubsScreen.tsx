import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../../constants/Theme';
import { CLUBS, Club } from '../../constants/MockData';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Entry',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const USER_SCORE = 2847;

function ClubCard({ club, onJoin }: { club: Club; onJoin: () => void }) {
  const router = useRouter();
  const canJoin = USER_SCORE >= club.requiredScore;
  const openClub = () => router.push({ pathname: '/club/[id]', params: { id: club.id } });

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={openClub} style={styles.clubCard}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: club.image }} style={styles.clubImage} />
        <View style={styles.imageOverlay} />
        {club.isJoined && (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedBadgeText}>Member</Text>
          </View>
        )}
      </View>

      <View style={styles.clubBody}>
        <View style={styles.clubMeta}>
          <Text style={[styles.categoryText, { color: club.categoryColor }]}>
            {club.category.toUpperCase()}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.levelText}>{LEVEL_LABELS[club.level]}</Text>
        </View>

        <Text style={TextStyles.cardTitle}>{club.name}</Text>
        <Text style={styles.clubDesc}>{club.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{club.members.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{club.weeklyActivity}%</Text>
            <Text style={styles.statLabel}>Weekly Activity</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{club.requiredScore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Required Score</Text>
          </View>
        </View>

        {club.currentChallenge && (
          <View style={styles.challengeBox}>
            <Text style={styles.challengeLabel}>CURRENT BRIEF</Text>
            <Text style={styles.challengeText}>{club.currentChallenge}</Text>
          </View>
        )}

        <View style={styles.tagsRow}>
          {club.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {!club.isJoined && (
          <TouchableOpacity
            style={[styles.joinBtn, !canJoin && styles.joinBtnDisabled]}
            onPress={canJoin ? onJoin : undefined}
            disabled={!canJoin}
          >
            <Text style={[styles.joinBtnText, !canJoin && styles.joinBtnTextDisabled]}>
              {canJoin ? 'Request Admission' : `Score ${club.requiredScore} Required`}
            </Text>
          </TouchableOpacity>
        )}

        {club.isJoined && (
          <TouchableOpacity style={styles.activeBtn} onPress={openClub}>
            <Text style={styles.activeBtnText}>Enter Discourse</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ClubsScreen() {
  const [clubs, setClubs] = useState(CLUBS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined' | 'available'>('all');

  const filtered = clubs.filter(c => {
    if (activeFilter === 'joined') return c.isJoined;
    if (activeFilter === 'available') return !c.isJoined && USER_SCORE >= c.requiredScore;
    return true;
  });

  const handleJoin = (id: string) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, isJoined: true, members: c.members + 1 } : c));
  };

  const myClubs = clubs.filter(c => c.isJoined);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={TextStyles.kicker}>Curated Intelligence</Text>
          <Text style={[TextStyles.screenTitle, { marginTop: 4 }]}>
            Clubs<Text style={{ color: Colors.primary }}>.</Text>
          </Text>
          <Text style={[TextStyles.tagline, { marginTop: 6 }]}>Engage in high-level discourse.</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreText}>{USER_SCORE.toLocaleString()}</Text>
        </View>
      </View>

      {myClubs.length > 0 && (
        <View style={styles.myClubsCard}>
          <Text style={styles.myClubsTitle}>YOUR CIRCLES — {myClubs.length}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {myClubs.map(club => (
                <View key={club.id} style={styles.myClubChip}>
                  <Text style={styles.myClubName} numberOfLines={2}>{club.name}</Text>
                  <View style={styles.activityBar}>
                    <View style={[
                      styles.activityFill,
                      { width: `${club.weeklyActivity}%` }
                    ]} />
                  </View>
                  <Text style={styles.activityLabel}>{club.weeklyActivity}% active</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All Clubs' },
          { key: 'joined', label: 'Mine' },
          { key: 'available', label: 'Eligible' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.key as any)}
          >
            <Text style={[styles.filterTabText, activeFilter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ClubCard club={item} onJoin={() => handleJoin(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={TextStyles.emptyTitle}>No clubs available</Text>
            <Text style={[TextStyles.emptyDescription, { textAlign: 'center', paddingHorizontal: Spacing.xl }]}>
              Continue building your score to unlock further circles.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  kicker: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scoreBadge: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
  },
  scoreText: {
    fontSize: 18,
    fontFamily: Fonts.serif,
    color: Colors.primary,
    marginTop: 2,
  },
  myClubsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  myClubsTitle: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
  },
  myClubChip: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.base,
    gap: 8,
    width: 150,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  myClubName: {
    fontSize: 12,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  activityBar: {
    height: 2,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 1,
    overflow: 'hidden',
  },
  activityFill: {
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.primary,
  },
  activityLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  filterTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  filterTabText: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },

  clubCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  imageWrap: { position: 'relative' },
  clubImage: {
    width: '100%',
    height: 160,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background + 'AA',
  },
  joinedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Colors.background + 'EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  joinedBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  clubBody: {
    padding: Spacing.lg,
    gap: 12,
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    letterSpacing: 2,
  },
  metaDot: { color: Colors.textMuted, fontSize: 12 },
  levelText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  clubName: {
    fontSize: 22,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  clubDesc: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.base,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontFamily: Fonts.serif,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statDivider: { width: 1, backgroundColor: Colors.surfaceBorder },
  challengeBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.base,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  challengeLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  challengeText: {
    fontSize: 13,
    fontFamily: Fonts.serifItalic,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
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
  joinBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnDisabled: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.surfaceBorder,
  },
  joinBtnText: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  joinBtnTextDisabled: {
    color: Colors.textMuted,
  },
  activeBtn: {
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 4,
  },
  activeBtnText: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
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
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
