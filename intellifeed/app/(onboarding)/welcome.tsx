import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, Shadow } from '../../constants/Theme';
import { Field, PrimaryButton, Banner } from '../../components/auth/FormPrimitives';
import { useAuth } from '../../lib/AuthContext';
import { useProfile } from '../../lib/ProfileContext';
import { INTEREST_OPTIONS } from '../../constants/Interests';

export default function OnboardingWelcome() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateProfile } = useProfile();

  const [fullName, setFullName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (i: string) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const onSubmit = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please tell us your name to personalize your experience.');
      return;
    }
    if (interests.length < 3) {
      setError('Choose at least three interests so we can curate meaningfully.');
      return;
    }
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>Welcome to InteliFeed</Text>
          <Text style={styles.title}>Curate Your Cognitive Diet</Text>
          <Text style={styles.subtitle}>
            A few moments of intention now will shape every recommendation we surface.
          </Text>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Your Name</Text>
            <Text style={styles.sectionHint}>How would you like to be addressed?</Text>
            <Field
              label=""
              value={fullName}
              onChangeText={setFullName}
              placeholder="Itai Bell"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />

            {user?.email ? (
              <View style={styles.emailRow}>
                <Text style={styles.emailLabel}>Account</Text>
                <Text style={styles.emailValue}>{user.email}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Domains of Interest</Text>
            <Text style={styles.sectionHint}>
              Select at least three. You can refine these anytime in your profile.
            </Text>

            <View style={styles.chipsGrid}>
              {INTEREST_OPTIONS.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[styles.chip, selected && styles.chipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.selectedCount}>
              {interests.length} selected
            </Text>
          </View>

          {error ? <Banner kind="error" message={error} /> : null}

          <View style={{ marginTop: Spacing.lg }}>
            <PrimaryButton
              label="Begin Reading"
              onPress={onSubmit}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  kicker: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.base,
    ...Shadow.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  emailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  emailLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  emailValue: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.sansSemibold,
  },
  selectedCount: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 12,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
});
