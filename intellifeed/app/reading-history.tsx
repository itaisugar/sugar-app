import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles } from '../constants/Theme';
import { fetchReadHistory } from '../lib/reads';
import { FeedItem } from '../lib/content';

export default function ReadingHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadHistory().then(list => {
      setItems(list);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={TextStyles.overline}>Article History</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.headerBlock}>
        <Text style={TextStyles.kicker}>Articles Consumed</Text>
        <Text style={styles.headerTitle}>{items.length}</Text>
        <Text style={[TextStyles.tagline, { marginTop: 4 }]}>
          The work you have given attention to.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={TextStyles.emptyTitle}>Nothing read yet</Text>
          <Text style={[TextStyles.emptyDescription, { textAlign: 'center', marginTop: 8 }]}>
            When you mark an article as read, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 80, gap: 14 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.row}
              onPress={() => router.push({ pathname: '/article/[id]', params: { id: item.id } })}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, { backgroundColor: Colors.surfaceMuted }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cat, { color: item.categoryColor }]} numberOfLines={1}>
                  {item.category.toUpperCase()}
                </Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.source} · {item.readTime} min
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18, color: Colors.textPrimary },
  headerBlock: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base,
    borderBottomWidth: 0.5, borderColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontFamily: Fonts.serif, fontSize: 44, lineHeight: 48,
    color: Colors.textPrimary, letterSpacing: -1,
    marginTop: 6,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 6 },
  row: {
    flexDirection: 'row', gap: 12,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  cover: {
    width: 64, height: 64, borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceMuted,
  },
  cat: {
    fontSize: 9, letterSpacing: 1.2,
    fontFamily: Fonts.sansSemibold,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.serif, fontSize: 14, lineHeight: 19,
    color: Colors.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontFamily: Fonts.sans, fontSize: 11,
    color: Colors.textMuted,
  },
});
