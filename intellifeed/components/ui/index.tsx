// ─── Noir shared primitives ──────────────────────────────────────────────────
// Recreates the prototype's components.jsx primitives in React Native using the
// built-in Animated API (no reanimated). Every motion respects reduced-motion.

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts } from '../../constants/Theme';
import { getCategoryStyle } from '../../constants/Categories';
import { EASE, useReducedMotion } from '../../lib/motion';

// ── Tappable — press-scale to 0.978 (the `.tap` cue) ────────────────────────
type TappableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
};
export function Tappable({ style, scaleTo = 0.978, children, ...rest }: TappableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const to = (v: number) => {
    if (reduced) return;
    Animated.timing(scale, { toValue: v, duration: 200, easing: EASE, useNativeDriver: true }).start();
  };
  return (
    <Pressable onPressIn={() => to(scaleTo)} onPressOut={() => to(1)} {...rest}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── ZoomImage — slow hover-zoom on web; static on touch (no press capture) ──
type ZoomImageProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  zoom?: number;
  children?: React.ReactNode;
};
export function ZoomImage({ source, style, zoom = 1.055, children }: ZoomImageProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const to = (v: number) => {
    if (reduced) return;
    Animated.timing(scale, { toValue: v, duration: 1100, easing: EASE, useNativeDriver: true }).start();
  };
  const hover = {
    onPointerEnter: () => to(zoom),
    onPointerLeave: () => to(1),
  } as any;
  return (
    <View style={[{ overflow: 'hidden' }, style]} {...hover}>
      <Animated.Image
        source={source}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', transform: [{ scale }] }]}
      />
      {children}
    </View>
  );
}

// ── Equalizer — 5 bars; loop while playing, rest when idle ──────────────────
export function Equalizer({ playing, color = Colors.onPrimary, bars = 5 }: { playing: boolean; color?: string; bars?: number }) {
  const reduced = useReducedMotion();
  const REST = 6;
  const heights = useRef(Array.from({ length: bars }, () => new Animated.Value(REST))).current;

  useEffect(() => {
    if (!playing || reduced) {
      heights.forEach((h) => { h.stopAnimation(() => h.setValue(REST)); });
      return;
    }
    const loops = heights.map((h, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(h, { toValue: 16, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(h, { toValue: 5, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, reduced]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: 16 }}>
      {heights.map((h, i) => (
        <Animated.View key={i} style={{ width: 2.5, height: h, borderRadius: 2, backgroundColor: color, opacity: playing ? 1 : 0.5 }} />
      ))}
    </View>
  );
}

// ── LivePulse — crimson dot + expanding fading ring ─────────────────────────
export function LivePulse({ label }: { label?: string }) {
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const l = Animated.loop(Animated.timing(p, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    l.start();
    return () => l.stop();
  }, [reduced]);
  const scale = p.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const opacity = p.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 6, height: 6 }}>
        <Animated.View style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, opacity, transform: [{ scale }] }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary }} />
      </View>
      {label ? (
        <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 0.2, color: Colors.textMuted }}>{label}</Text>
      ) : null}
    </View>
  );
}

// ── MemberFaces — overlapping initial circles ───────────────────────────────
export function MemberFaces({ faces, size = 22, ring = Colors.surface, onDark = false, max = 4 }: {
  faces: string[]; size?: number; ring?: string; onDark?: boolean; max?: number;
}) {
  const shown = faces.slice(0, max);
  return (
    <View style={{ flexDirection: 'row' }}>
      {shown.map((f, i) => (
        <View
          key={i}
          style={{
            width: size, height: size, borderRadius: size / 2,
            marginLeft: i === 0 ? 0 : -size * 0.34,
            backgroundColor: onDark ? 'rgba(255,255,255,0.18)' : Colors.surfaceAlt,
            borderWidth: 1.5, borderColor: ring,
            alignItems: 'center', justifyContent: 'center',
            zIndex: max - i,
          }}
        >
          <Text style={{ fontFamily: Fonts.sansSemibold, fontSize: size * 0.4, color: onDark ? '#FFFFFF' : Colors.textSecondary }}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

// ── CatTag — frosted category pill (glyph + label) ──────────────────────────
export function CatTag({ category, onDark = true, small = false }: { category: string; onDark?: boolean; small?: boolean }) {
  const s = getCategoryStyle(category);
  const fg = onDark ? '#FFFFFF' : s.color;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: small ? 7 : 9, paddingVertical: small ? 3 : 5, borderRadius: 999,
      backgroundColor: onDark ? 'rgba(255,255,255,0.14)' : s.background,
      borderWidth: 1, borderColor: onDark ? 'rgba(255,255,255,0.18)' : Colors.border,
    }}>
      <Text style={{ fontSize: small ? 10 : 11, color: fg }}>{s.glyph}</Text>
      <Text style={{ fontFamily: Fonts.sansSemibold, fontSize: small ? 9.5 : 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: fg }}>
        {category}
      </Text>
    </View>
  );
}

// ── GoldBadge — frosted pill + gold sparkle (Trending / Featured) ───────────
export function GoldBadge({ label }: { label: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: Colors.hairlineGold,
    }}>
      <Text style={{ fontSize: 11, color: Colors.gold }}>✦</Text>
      <Text style={{ fontFamily: Fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.gold }}>{label}</Text>
    </View>
  );
}

// ── EntranceView — fade + rise on mount ─────────────────────────────────────
export function EntranceView({ children, style, delay = 0 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; delay?: number }) {
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) { p.setValue(1); return; }
    Animated.timing(p, { toValue: 1, duration: 360, delay, easing: EASE, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: p, transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ── ProgressRing — circular progress with a centered label ──────────────────
export function ProgressRing({ pct, size = 46, stroke = 3.5, color = Colors.primary, label, trackColor = Colors.border }: {
  pct: number; size?: number; stroke?: number; color?: string; label?: string; trackColor?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <Circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
        />
      </Svg>
      <Text style={{ fontFamily: Fonts.sansBold, fontSize: size > 40 ? 12.5 : 10.5, letterSpacing: -0.2, color: Colors.textPrimary }}>
        {label != null ? label : `${Math.round(pct)}%`}
      </Text>
    </View>
  );
}

// ── Progress — slim horizontal bar ──────────────────────────────────────────
export function Progress({ pct, color = Colors.primary, height = 3, track = Colors.border }: {
  pct: number; color?: string; height?: number; track?: string;
}) {
  return (
    <View style={{ height, backgroundColor: track, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

// ── MemberMeter — 5 ticks + "N% active" ─────────────────────────────────────
export function MemberMeter({ percent }: { percent: number }) {
  const filled = Math.round((percent / 100) * 5);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i < filled ? Colors.primary : Colors.borderStrong }} />
        ))}
      </View>
      <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.textMuted }}>{percent}% active</Text>
    </View>
  );
}
