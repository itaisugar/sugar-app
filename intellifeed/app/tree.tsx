import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../constants/Theme';
import { useProfile } from '../lib/ProfileContext';
import { fetchBranchCounts } from '../lib/knowledge';

const ACCENT_PALETTE = [
  Colors.primary,
  Colors.accentSage,
  Colors.accentOchre,
  Colors.accentBurgundy,
  Colors.textFaint,
  Colors.primary,
  Colors.accentSage,
];

// Branches are the user's interests; sizes reflect real leaf counts
// (knowledge_leaves filed under each interest). A new account has all-small
// branches that grow as the user adds articles to knowledge.
function deriveBranches(interests: string[], counts: Record<string, number>) {
  return interests.slice(0, 7).map((name, i) => {
    const leafCount = counts[name] ?? 0;
    // Branch "size" mirrors leaf count, with a floor so empty branches still render.
    const val = Math.max(4, leafCount * 3 + 4);
    return {
      name,
      val,
      leafCount,
      c: ACCENT_PALETTE[i % ACCENT_PALETTE.length],
    };
  });
}

export default function KnowledgeTreeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const branches = useMemo(
    () => deriveBranches(profile?.interests ?? [], counts),
    [profile?.interests, counts],
  );
  const [active, setActive] = useState<string | null>(branches[0]?.name ?? null);

  // Refresh counts whenever the screen comes back into focus (e.g. after adding a leaf)
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const c = await fetchBranchCounts();
          setCounts(c);
        } catch {}
        finally { setLoading(false); }
      })();
    }, []),
  );

  useEffect(() => {
    if (!active && branches.length > 0) setActive(branches[0].name);
  }, [branches.length]);

  const { width: screenW } = Dimensions.get('window');
  const W = screenW;
  const H = 580;
  const cx = W / 2;
  const cy = 460;

  // Arrange so the biggest branch sits at the center of the fan.
  const sorted = [...branches].sort((a, b) => b.val - a.val);
  const arranged = (() => {
    if (sorted.length === 0) return [];
    const N = sorted.length;
    const mid = Math.floor(N / 2);
    const out = new Array(N);
    out[mid] = sorted[0];
    for (let i = 1; i < N; i++) {
      const side = i % 2 === 1 ? -1 : 1;
      const off = Math.ceil(i / 2);
      out[mid + side * off] = sorted[i];
    }
    return out;
  })();

  const angleStart = Math.PI * 1.22;
  const angleEnd = Math.PI * 1.78;
  const positions = arranged.map((b, i) => {
    const t = arranged.length === 1 ? 0.5 : i / (arranged.length - 1);
    const a = angleStart + (angleEnd - angleStart) * t;
    const r = 150 + b.val * 0.6;
    return {
      ...b,
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      rad: 10 + b.val * 0.5,
    };
  });

  const leaves = positions.flatMap((p, pi) =>
    Array.from({ length: Math.floor(p.val / 3) }).map((_, i) => {
      const a = i * 1.3 + pi * 0.7;
      const d = p.rad + 6 + (i % 4) * 5;
      return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, c: p.c };
    }),
  );

  const activeNode = positions.find(p => p.name === active) ?? positions[0];

  // ── Empty state ──
  if (positions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => router.back()} count={0} />
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Begin reading to grow your tree</Text>
          <Text style={[TextStyles.emptyDescription, { textAlign: 'center', marginTop: 8, paddingHorizontal: Spacing.xl }]}>
            Each article and podcast you engage with contributes to a domain in your personal knowledge map.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => router.back()} count={positions.length} />

      <View style={styles.title}>
        <Text style={TextStyles.kicker}>Your canopy · {positions.reduce((s, p) => s + p.val, 0)} signals</Text>
        <Text style={styles.heroTitle}>
          Your <Text style={{ fontFamily: Fonts.serifItalicMedium, color: Colors.primary }}>knowledge tree.</Text>
        </Text>
        <Text style={TextStyles.tagline}>An evolving map of what you actually read.</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="100%" r="80%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.10" />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#halo)" />

          {/* Branches */}
          {positions.map((p, i) => (
            <Path
              key={i}
              d={`M ${cx} ${cy} Q ${cx + (p.x - cx) * 0.4} ${(cy + p.y) / 2 - 24} ${p.x} ${p.y}`}
              stroke={p.name === active ? Colors.textPrimary : Colors.surfaceBorderStrong}
              strokeWidth={p.name === active ? 1.4 : 0.6}
              fill="none"
              opacity={p.name === active ? 1 : 0.6}
            />
          ))}

          {/* Trunk */}
          <Line x1={cx} y1={cy} x2={cx} y2={cy + 50} stroke={Colors.textPrimary} strokeWidth={1.4} />
          <Circle cx={cx} cy={cy} r={7} fill={Colors.textPrimary} />

          {/* Leaves */}
          {leaves.map((l, i) => (
            <Circle key={i} cx={l.x} cy={l.y} r={1.4} fill={l.c} opacity={0.5} />
          ))}

          {/* Nodes */}
          {positions.map((p, i) => {
            const isActive = p.name === active;
            return (
              <React.Fragment key={i}>
                {isActive && (
                  <Circle cx={p.x} cy={p.y} r={p.rad + 8} fill={p.c} opacity={0.16} />
                )}
                <Circle cx={p.x} cy={p.y} r={p.rad} fill={p.c} opacity={isActive ? 1 : 0.85} />
                <SvgText
                  x={p.x}
                  y={p.y + 3.5}
                  fontFamily={Fonts.monoMedium}
                  fontSize={9}
                  fill={Colors.surface}
                  textAnchor="middle"
                >
                  {p.val}
                </SvgText>
                <SvgText
                  x={p.x}
                  y={p.y + p.rad + 14}
                  fontFamily={Fonts.serifItalic}
                  fontSize={11}
                  fill={isActive ? Colors.textPrimary : Colors.textSecondary}
                  textAnchor="middle"
                >
                  {p.name}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Tap zones (positioned absolutely over each node) */}
        {positions.map(p => (
          <TouchableOpacity
            key={p.name}
            onPress={() => setActive(p.name)}
            style={[
              styles.tapZone,
              { left: p.x - p.rad - 8, top: p.y - p.rad - 8, width: (p.rad + 8) * 2, height: (p.rad + 8) * 2 },
            ]}
          />
        ))}
      </View>

      {/* Active branch card */}
      <View style={styles.activeCard}>
        <View style={styles.activeCardHeader}>
          <View style={[styles.activeDot, { backgroundColor: activeNode.c }]} />
          <Text style={[TextStyles.kicker, { color: activeNode.c }]}>
            {activeNode.name} · {activeNode.leafCount} {activeNode.leafCount === 1 ? 'leaf' : 'leaves'}
          </Text>
        </View>
        <Text style={[TextStyles.tagline, { marginTop: 6, marginBottom: 14 }]}>
          {activeNode.leafCount > 0
            ? `Tap to see everything you've grafted onto ${activeNode.name}.`
            : `Add articles to this branch from the Reader to grow it.`}
        </Text>
        <View style={styles.activeCardActions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push({ pathname: '/tree/[branch]', params: { branch: activeNode.name } })}
            activeOpacity={0.85}
          >
            <Text style={TextStyles.buttonPrimary}>View leaves</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack, count }: { onBack: () => void; count: number }) {
  return (
    <View style={styles.topbar}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Text style={styles.iconBtnText}>←</Text>
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text style={TextStyles.overline}>Knowledge tree</Text>
        <Text style={{ fontFamily: Fonts.serif, fontSize: 14, color: Colors.textPrimary, marginTop: 2 }}>
          {count > 0 ? `${count} branches` : 'Empty canopy'}
        </Text>
      </View>
      <View style={styles.iconBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18, color: Colors.textPrimary },

  title: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: Colors.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },

  tapZone: { position: 'absolute', borderRadius: 999 },

  activeCard: {
    position: 'absolute',
    bottom: Spacing.base, left: Spacing.lg, right: Spacing.lg,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.surfaceBorder,
    ...Shadow.md,
  },
  activeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  activeCardActions: { flexDirection: 'row', gap: 8 },
  primaryAction: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.textPrimary,
  },
  secondaryAction: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
  },
});
