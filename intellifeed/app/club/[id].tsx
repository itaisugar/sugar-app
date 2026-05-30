import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Image, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { CLUBS } from '../../constants/MockData';
import { useProfile } from '../../lib/ProfileContext';
import {
  fetchJoinedClubIds, joinClub, leaveClub,
  fetchClubComments, postClubComment, deleteClubComment, ClubComment,
} from '../../lib/clubs';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Entry',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ClubDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const score = profile?.total_score ?? 0;
  const club = CLUBS.find(c => c.id === id) ?? CLUBS[0];

  const [isMember, setIsMember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<ClubComment[]>([]);
  const [composer, setComposer] = useState('');
  const [posting, setPosting] = useState(false);

  const loadAll = useCallback(async () => {
    if (!club) return;
    const joined = await fetchJoinedClubIds();
    setIsMember(joined.has(club.id));
    try {
      const list = await fetchClubComments(club.id);
      setComments(list);
    } catch {}
  }, [club]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onJoinLeave = async () => {
    if (!club || busy) return;
    setBusy(true);
    try {
      if (isMember) {
        await leaveClub(club.id);
        setIsMember(false);
      } else {
        if (score < club.requiredScore) {
          Alert.alert('Not enough points', `You need ${club.requiredScore} points to join. You have ${score}.`);
          return;
        }
        await joinClub(club.id);
        setIsMember(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not update membership.');
    } finally {
      setBusy(false);
    }
  };

  const onPost = async () => {
    const text = composer.trim();
    if (!text || posting || !club) return;
    setPosting(true);
    try {
      await postClubComment(club.id, text);
      setComposer('');
      const list = await fetchClubComments(club.id);
      setComments(list);
    } catch (e: any) {
      Alert.alert('Could not post', e?.message ?? 'Try again.');
    } finally {
      setPosting(false);
    }
  };

  const onDelete = async (commentId: string) => {
    try {
      await deleteClubComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  if (!club) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Club not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnPrimary}>
            <Text style={TextStyles.buttonPrimary}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: club.image }} style={styles.hero} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <Text style={{ fontSize: 18, color: Colors.textPrimary }}>←</Text>
          </TouchableOpacity>
          {isMember ? (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>★ Member</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {/* Meta */}
          <View style={styles.metaRow}>
            <Text style={TextStyles.kicker}>{club.category}</Text>
            <View style={styles.metaDot} />
            <Text style={TextStyles.overline}>{LEVEL_LABELS[club.level]}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{club.name}</Text>
          <Text style={[TextStyles.body, { marginTop: 10 }]}>{club.description}</Text>

          {/* Members + CTA */}
          <View style={styles.membersRow}>
            <View style={styles.avatars}>
              {['T', 'M', 'R', 'S', 'N'].map((l, i) => (
                <View
                  key={i}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: [
                        Colors.primary, Colors.accentSage, Colors.accentBurgundy,
                        Colors.accentOchre, Colors.textPrimary,
                      ][i],
                      marginLeft: i === 0 ? 0 : -8,
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>{l}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.tagline, { color: Colors.textSecondary }]}>
                + {club.members.toLocaleString()} more readers
              </Text>
              <Text style={[TextStyles.meta, { marginTop: 2 }]}>
                Thursdays at 19:00 GMT
              </Text>
            </View>
            <TouchableOpacity
              onPress={onJoinLeave}
              disabled={busy}
              style={[styles.ctaBtn, isMember && styles.ctaBtnAlt]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={isMember ? Colors.primary : Colors.surface} />
              ) : (
                <Text style={[styles.ctaText, isMember && { color: Colors.primary }]}>
                  {isMember ? 'Leave' : 'Join'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Current reading */}
          <View style={styles.section}>
            <Text style={[TextStyles.overline, { marginBottom: 12 }]}>Current reading · this quarter</Text>
            <View style={styles.readingCard}>
              <View style={styles.readingCover} />
              <View style={{ flex: 1 }}>
                <Text style={TextStyles.kicker}>Quarterly Volume</Text>
                <Text style={styles.readingTitle}>
                  {club.currentChallenge ?? `The ${club.category} Reader — Vol. II`}
                </Text>
                <Text style={[TextStyles.helper, { marginTop: 6 }]}>
                  {club.weeklyActivity}% of members active this week
                </Text>
                <View style={styles.readingBar}>
                  <View style={[styles.readingBarFill, { width: `${club.weeklyActivity}%` }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Discussion */}
          <View style={styles.section}>
            <Text style={[TextStyles.overline, { marginBottom: 12 }]}>Discussion</Text>

            {isMember ? (
              <View style={styles.composerLive}>
                <TextInput
                  value={composer}
                  onChangeText={setComposer}
                  placeholder="Add your thoughts to the discourse…"
                  placeholderTextColor={Colors.textFaint}
                  multiline
                  style={styles.composerInput}
                />
                <TouchableOpacity
                  onPress={onPost}
                  disabled={posting || !composer.trim()}
                  style={[styles.postBtn, (!composer.trim() || posting) && { opacity: 0.5 }]}
                >
                  <Text style={styles.postBtnText}>{posting ? '...' : 'Post'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.lockedCard}>
                <Text style={[TextStyles.kicker, { marginBottom: 6 }]}>Members only</Text>
                <Text style={[TextStyles.tagline, { marginTop: 6, textAlign: 'center' }]}>
                  Join the club to contribute to the discussion.
                </Text>
              </View>
            )}

            {comments.length === 0 ? (
              <Text style={[TextStyles.helper, { marginTop: 16, textAlign: 'center' }]}>
                No comments yet. {isMember ? 'Be the first.' : ''}
              </Text>
            ) : (
              comments.map((m, i) => {
                const initials = (m.author_name ?? '·').trim().charAt(0).toUpperCase();
                const mine = profile?.id === m.user_id;
                return (
                  <View key={m.id} style={[styles.message, i > 0 && { borderTopWidth: 0.5, borderColor: Colors.surfaceBorder }]}>
                    <View style={[styles.messageAvatar, { backgroundColor: Colors.primary }]}>
                      <Text style={styles.messageInitial}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageWho}>{m.author_name ?? 'Anonymous'}</Text>
                        <Text style={TextStyles.meta}>{relativeTime(m.created_at)}</Text>
                        {mine ? (
                          <TouchableOpacity onPress={() => onDelete(m.id)} style={{ marginLeft: 'auto' }}>
                            <Text style={[TextStyles.meta, { color: Colors.textMuted }]}>Delete</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <Text style={styles.messageText}>{m.body}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 8 },

  heroWrap: { position: 'relative', height: 220, backgroundColor: Colors.surfaceMuted },
  hero: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,237,224,0.35)',
  },
  heroBack: {
    position: 'absolute', top: Spacing.base, left: Spacing.base,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  memberBadge: {
    position: 'absolute', top: Spacing.base, right: Spacing.base,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: Colors.primary,
  },
  memberBadgeText: {
    fontFamily: Fonts.monoMedium, fontSize: 9,
    letterSpacing: 1.4, textTransform: 'uppercase',
    color: Colors.primary,
  },

  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginTop: -24,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textFaint },

  title: {
    fontFamily: Fonts.serif,
    fontSize: 30, lineHeight: 32,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
    marginTop: 8,
  },

  membersRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.base,
    borderTopWidth: 0.5, borderBottomWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  avatarText: {
    color: Colors.surface,
    fontFamily: Fonts.serif, fontSize: 11,
  },
  ctaBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  ctaBtnAlt: {
    backgroundColor: 'transparent',
    borderWidth: 0.5, borderColor: Colors.primary,
  },
  ctaText: {
    fontFamily: Fonts.sansSemibold, fontSize: 11,
    letterSpacing: 0.6, textTransform: 'uppercase',
    color: Colors.surface,
  },

  section: { marginTop: Spacing.xl },

  readingCard: {
    flexDirection: 'row', gap: 12,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.surfaceBorder,
  },
  readingCover: {
    width: 84, height: 110,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
  },
  readingTitle: {
    fontFamily: Fonts.serif, fontSize: 17, lineHeight: 22,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  readingBar: {
    marginTop: 10, height: 3,
    backgroundColor: Colors.surfaceBorder, borderRadius: 1.5,
  },
  readingBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 1.5 },

  message: {
    flexDirection: 'row', gap: 10,
    paddingVertical: 14,
  },
  messageAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  messageInitial: { color: Colors.surface, fontFamily: Fonts.serif, fontSize: 12 },
  messageHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  messageWho: { fontFamily: Fonts.sansSemibold, fontSize: 12, color: Colors.textPrimary },
  messageText: { fontFamily: Fonts.serifRegular, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  composer: {
    marginTop: 12, padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong, borderStyle: 'dashed',
  },
  composerLive: {
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.base,
  },
  composerInput: {
    fontFamily: Fonts.serifRegular,
    fontSize: 14, lineHeight: 21,
    color: Colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  postBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  postBtnText: {
    color: Colors.surface,
    fontFamily: Fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  lockedCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  lockedTitle: {
    fontFamily: Fonts.serif, fontSize: 22, lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  backBtnPrimary: {
    marginTop: 16,
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
});
