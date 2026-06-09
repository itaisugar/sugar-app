// Branded loading screen — shown while fonts load and while the session/profile
// resolve. Centres the champagne-gold "sparkle" homescreen mark (rendered as a
// crisp SVG so it scales cleanly during the breathing pulse) with the official
// "Sapience." wordmark beneath it, white with the crimson period.
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { Colors, Fonts } from '../constants/Theme';

// The 4-point concave sparkle from scripts/gen-icon.js, redrawn as vector art:
// quadratic edges that bow toward the centre give the pinched "twinkle" shape,
// filled with the same champagne-gold vertical gradient, plus a small gold
// twinkle off the top-right.
function SparkleMark({ size = 104 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="bsGold" x1="50" y1="6" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F0E0B4" />
          <Stop offset="0.5" stopColor="#CDA86A" />
          <Stop offset="1" stopColor="#B08A4E" />
        </LinearGradient>
        <RadialGradient id="bsGlow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#CDA86A" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#CDA86A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* soft gold halo behind the mark */}
      <Circle cx="50" cy="50" r="50" fill="url(#bsGlow)" />
      {/* main sparkle */}
      <Path
        d="M50 8 Q56.7 43.3 92 50 Q56.7 56.7 50 92 Q43.3 56.7 8 50 Q43.3 43.3 50 8 Z"
        fill="url(#bsGold)"
      />
      {/* small twinkle */}
      <Path
        d="M78 26 Q79.3 28.7 82 30 Q79.3 31.3 78 34 Q76.7 31.3 74 30 Q76.7 28.7 78 26 Z"
        fill="#F0E0B4"
      />
    </Svg>
  );
}

// The homescreen mark, breathing grow/shrink in a gentle loop. Reused by the
// full-screen splash and by the feed's "Creating Your Sapience." loading state.
export function PulsingSparkle({ size = 104 }: { size?: number }) {
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <SparkleMark size={size} />
    </Animated.View>
  );
}

// `label` is the wordmark text before the crimson period. Defaults to the
// "Sapience." mark for the boot splash; the feed's loading state passes
// "Creating Your Sapience" so the hand-off is pixel-identical — same logo
// size/position, same font/size, same distance — and only the words change.
export default function BrandSplash({ label = 'Sapience' }: { label?: string }) {
  return (
    <View style={styles.root}>
      <PulsingSparkle size={104} />
      <Text style={styles.word}>
        {label}<Text style={styles.dot}>.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
  },
  dot: {
    color: Colors.primary,
  },
});
