import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, TextStyles, Fonts } from '../../constants/Theme';
import { Banner } from '../../components/auth/FormPrimitives';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';
import { INTEREST_OPTIONS } from '../../constants/Interests';
import { useReducedMotion, EASE } from '../../lib/motion';

const TOTAL_STEPS = 3;
const ORB = 460;

export default function OnboardingWelcome() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slow background drift for the gradient orb (static under reduced motion).
  const drift = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (reduced) {
      drift.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: EASE, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: EASE, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, drift]);

  // Each step fades up on entry (settles instantly under reduced motion).
  const enter = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 340, easing: EASE, useNativeDriver: true }).start();
  }, [step, reduced, enter]);

  const toggleInterest = (i: string) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const goNext = () => {
    setError(null);
    // Validate the personalization step (the final step) before finishing.
    if (step === 2) {
      if (!fullName.trim()) {
        setError('Please tell us your name to personalize your experience.');
        return;
      }
      if (interests.length < 3) {
        setError('Choose at least three interests so we can curate meaningfully.');
        return;
      }
    }
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    finish();
  };

  const finish = async () => {
    setError(null);
    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        interests,
        onboarded: true,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ctaLabel = step === TOTAL_STEPS - 1 ? 'Begin Reading' : 'Continue';

  const driftStyle = {
    transform: [
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-34, 30] }) },
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-22, 26] }) },
      { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] }) },
    ],
  };
  const enterStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Ambient gradient orb */}
      <Animated.View style={[styles.orb, driftStyle]} pointerEvents="none">
        <Svg width={ORB} height={ORB}>
          <Defs>
            <RadialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.5} />
              <Stop offset="55%" stopColor={Colors.primary} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB / 2} cy={ORB / 2} r={ORB / 2} fill="url(#orbGrad)" />
        </Svg>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header: back · dots */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            {step > 0 ? (
              <TouchableOpacity
                onPress={goBack}
                disabled={loading}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <IconChevronLeft color={Colors.textMuted} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={enterStyle}>
            {step === 0 && <IntroStep />}
            {step === 1 && <FeaturesStep />}
            {step === 2 && (
              <PersonalizeStep
                email={user?.email ?? null}
                fullName={fullName}
                setFullName={setFullName}
                interests={interests}
                toggleInterest={toggleInterest}
              />
            )}

            {error ? (
              <View style={{ marginTop: Spacing.lg }}>
                <Banner kind="error" message={error} />
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={goNext}
            disabled={loading}
            activeOpacity={0.88}
            style={[styles.cta, loading && styles.ctaDisabled]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.ctaText}>{ctaLabel}</Text>
                <View style={{ marginLeft: 10 }}>
                  <IconArrowRight color={Colors.onPrimary} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step 1 — What Sapience is ────────────────────────────────────────────────

function IntroStep() {
  return (
    <View style={styles.introBlock}>
      <Text style={[TextStyles.kicker, styles.kickerSpace]}>Welcome to Sapience</Text>
      <Text style={styles.bigTitle}>A calmer way to grow your mind</Text>
      <Text style={styles.lede}>
        A focused diet of articles, podcasts, and books around the ideas you care
        about — not an endless scroll. Read with intention, and actually retain it.
      </Text>
    </View>
  );
}

// ─── Step 2 — Features overview ───────────────────────────────────────────────

function FeaturesStep() {
  return (
    <View>
      <Text style={[TextStyles.kicker, styles.kickerSpace]}>What you can do</Text>
      <Text style={styles.bigTitle}>Everything in one place</Text>
      <Text style={[styles.lede, { marginBottom: Spacing.xl }]}>
        Four spaces work together to turn reading into lasting knowledge.
      </Text>

      <FeatureRow icon={<IconFeed color={Colors.primary} />} title="Feed"
        body="A personalized stream plus a daily audio Briefing tuned to your interests." />
      <FeatureRow icon={<IconPlan color={Colors.primary} />} title="Plan"
        body="Turn what you read into structured learning plans and track your progress." />
      <FeatureRow icon={<IconClubs color={Colors.primary} />} title="Clubs"
        body="Join reading clubs, follow the discussion, and take on challenges together." />
      <FeatureRow icon={<IconProfile color={Colors.primary} />} title="Profile"
        body="Watch your knowledge grow — streaks, tiers, and your Cognitive Map." />
    </View>
  );
}

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Step 3 — Name + interests ────────────────────────────────────────────────

function PersonalizeStep({
  email,
  fullName,
  setFullName,
  interests,
  toggleInterest,
}: {
  email: string | null;
  fullName: string;
  setFullName: (v: string) => void;
  interests: string[];
  toggleInterest: (i: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={[TextStyles.kicker, styles.kickerSpace]}>Personalize</Text>
      <Text style={styles.bigTitle}>Make it yours</Text>
      <Text style={[styles.lede, { marginBottom: Spacing.xl }]}>
        A few moments of intention now shape every recommendation we surface.
      </Text>

      <Text style={styles.fieldLabel}>What should we call you?</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Your name"
        placeholderTextColor={Colors.textFaint}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        style={[styles.underlineInput, focused && styles.underlineInputFocused]}
      />
      {email ? <Text style={styles.accountHint}>Signed in as {email}</Text> : null}

      <Text style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>
        Choose your interests
      </Text>
      <Text style={styles.fieldHint}>Pick at least three. Refine anytime later.</Text>

      <View style={styles.grid}>
        {INTEREST_OPTIONS.map((interest) => {
          const selected = interests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              onPress={() => toggleInterest(interest)}
              activeOpacity={0.8}
              style={[styles.interestCard, selected && styles.interestCardActive]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${interest}${selected ? ', selected' : ''}`}
            >
              <Text style={[styles.interestText, selected && styles.interestTextActive]}>
                {interest}
              </Text>
              <CheckDot selected={selected} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectedCount}>{interests.length} selected</Text>
    </View>
  );
}

function CheckDot({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.checkDot, selected && styles.checkDotActive]}>
      {selected ? (
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12.5l4.5 4.5L19 7"
            stroke={Colors.background}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowRight({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconFeed({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="3" rx="1.5" fill={color} />
      <Rect x="3" y="10.5" width="12" height="3" rx="1.5" fill={color} opacity="0.6" />
      <Rect x="3" y="17" width="15" height="3" rx="1.5" fill={color} opacity="0.35" />
    </Svg>
  );
}

function IconPlan({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="7" y1="9" x2="17" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="13" x2="14" y2="13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="17" x2="11" y2="17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function IconClubs({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="1.8" />
      <Circle cx="17" cy="9" r="2.4" stroke={color} strokeWidth="1.6" />
      <Path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M17 14c1.7.4 3 2 3 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  orb: {
    position: 'absolute',
    top: -ORB * 0.42,
    left: -ORB * 0.18,
    width: ORB,
    height: ORB,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  headerSide: {
    width: 72,
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingRight: 8,
  },
  backText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.textFaint,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  // Scroll body
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  kickerSpace: {
    marginBottom: 14,
  },
  bigTitle: {
    fontFamily: Fonts.display,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  lede: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  introBlock: {
    paddingTop: Spacing.xxl,
  },
  // Features
  featureRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  featureTitle: {
    fontFamily: Fonts.display,
    fontSize: 19,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  featureBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Personalize
  fieldLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  fieldHint: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 14,
  },
  underlineInput: {
    marginTop: 12,
    paddingVertical: 10,
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.borderStrong,
  },
  underlineInputFocused: {
    borderBottomColor: Colors.primary,
  },
  accountHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestCard: {
    width: '47.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  interestCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  interestText: {
    fontFamily: Fonts.displayMedium,
    fontSize: 15,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  interestTextActive: {
    color: Colors.textPrimary,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkDotActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  selectedCount: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 14,
    textAlign: 'right',
  },
  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  cta: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 16,
    letterSpacing: 0.1,
    color: Colors.onPrimary,
  },
});
