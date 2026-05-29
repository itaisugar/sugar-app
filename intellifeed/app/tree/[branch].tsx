import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../../constants/Theme';
import { fetchLeavesForBranch } from '../../lib/knowledge';
import { FeedItem } from '../../lib/content';

export default function BranchDrillScreen() {
  const router = useRouter();
  const { branch } = useLocalSearchParams<{ branch: string }>();
  const [leaves, setLeaves] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!branch) return;
      try {
        const items = await fetchLeavesForBranch(branch);
        setLeaves(items);
      } catch (e: any) {
        setError(e?.message ?? 'Could not load this branch.');
      } finally {
        setLoading(false);
      }
    })();
  }, [branch]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={TextStyles.overline}>Branch</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.heroBlock}>
        <Text style={TextStyles.kicker}>{branch}</Text>
        <Text style={styles.heroTitle}>
          The <Text style={{ fontFamily: Fonts.serifItalicMedium, color: Colors.primary }}>{branch}</Text> branch.
        </Text>
        <Text style={[TextStyles.tagline, { marginTop: 4 }]}>
          {leaves.length === 0
            ? 'No leaves yet.'
            : `${leaves.length} ${leaves.length === 1 ? 'leaf' : 'leaves'} grafted here.`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.statusBox}>
          <Text style={TextStyles.error}>{error}</Text>
        </View>
      ) : leaves.length === 0 ? (
        <View style={styles.statusBox}>
          <Text style={TextStyles.emptyTitle}>Empty branch</Text>
          <Text style={[TextStyles.emptyDescription, { textAlign: 'center', marginTop: 6 }]}>
            Open any article and tap "＋ Add to knowledge" to graft it onto this branch.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {leaves.map(leaf => (
            <TouchableOpacity
              key={leaf.id}
              style={styles.leafRow}
              onPress={() => router.push({ pathname: '/article/[id]', params: { id: leaf.id } })}
              activeOpacity={0.85}
            >
              {leaf.image ? (
                <Image source={{ uri: leaf.image }} style={styles.leafThumb} />
              ) : (
                <View style={[styles.leafThumb, { backgroundColor: Colors.surfaceMuted }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.kicker, { color: leaf.categoryColor, fontSize: 9 }]}>
                  {leaf.category}
                </Text>
                <Text style={styles.leafTitle} numberOfLines={2}>{leaf.title}</Text>
                <Text style={TextStyles.meta}>{leaf.source} · {leaf.readTime} min</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: {
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
  heroBlock: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
    marginTop: 6,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  leafRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  leafThumb: {
    width: 78,
    height: 78,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
  },
  leafTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    lineHeight: 21,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginVertical: 4,
  },
});
