import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, Shadow } from '../constants/Theme';
import { Field, PrimaryButton, Banner } from '../components/auth/FormPrimitives';
import { useAuth } from '../lib/AuthContext';
import { useProfile } from '../lib/ProfileContext';
import { INTEREST_OPTIONS } from '../constants/Interests';

const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, refresh, loading: profileLoading } = useProfile();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = useMemo(() => {
    if (!profile) return false;
    if (fullName.trim() !== (profile.full_name ?? '')) return true;
    if ((dateOfBirth || '') !== (profile.date_of_birth ?? '')) return true;
    const a = [...(profile.interests ?? [])].sort().join('|');
    const b = [...interests].sort().join('|');
    return a !== b;
  }, [profile, fullName, dateOfBirth, interests]);

  const toggleInterest = (i: string) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const onSave = async () => {
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (dateOfBirth && !DOB_REGEX.test(dateOfBirth.trim())) {
      setError('Date of birth must be in the format YYYY-MM-DD (e.g. 1995-03-15).');
      return;
    }
    if (interests.length < 1) {
      setError('Please select at least one interest.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth.trim() || null,
        interests,
      });
      await refresh();
      setSuccess(true);
      setTimeout(() => router.back(), 600);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.headerBack}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? <Banner kind="error" message={error} /> : null}
          {success ? <Banner kind="success" message="Profile saved." /> : null}

          {/* Identity */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Identity</Text>
            <Text style={styles.sectionHint}>This is how you'll appear across the app.</Text>

            <View style={{ marginTop: 12, gap: 14 }}>
              <Field
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Itai Bell"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />

              <View style={{ gap: 6 }}>
                <Text style={styles.readonlyLabel}>Email</Text>
                <View style={styles.readonlyField}>
                  <Text style={styles.readonlyValue}>{user?.email ?? '—'}</Text>
                  <Text style={styles.readonlyHint}>Read-only</Text>
                </View>
              </View>

              <Field
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Interests */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Domains of Interest</Text>
            <Text style={styles.sectionHint}>
              These shape what surfaces in your feed. Tap to toggle.
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
            <Text style={styles.selectedCount}>{interests.length} selected</Text>
          </View>

          <View style={{ marginTop: Spacing.base }}>
            <PrimaryButton
              label={success ? 'Saved' : 'Save Changes'}
              onPress={onSave}
              loading={saving}
              disabled={!dirty || saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  headerBack: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.base,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    lineHeight: 18,
  },
  readonlyLabel: {
    fontSize: 12,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textPrimary,
    letterSpacing: 0.4,
  },
  readonlyField: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readonlyValue: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
  },
  readonlyHint: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
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
