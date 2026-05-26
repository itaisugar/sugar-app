import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthShell } from '../../components/auth/AuthShell';
import { Field, PrimaryButton, Banner } from '../../components/auth/FormPrimitives';
import { useAuth } from '../../lib/AuthContext';
import { Colors, Fonts } from '../../constants/Theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);

    if (!email || !password || !confirm) {
      setError('Please complete every field to continue.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The passwords you entered do not match.');
      return;
    }

    setLoading(true);
    const { error, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    if (needsConfirmation) {
      setInfo('Almost there — confirm your email to activate your account.');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <AuthShell
      kicker="Begin"
      title="Create your account"
      subtitle="Join a community engaged in deliberate, lifelong learning."
      footer={
        <Text style={styles.footerText}>
          Already a member?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </Text>
      }
    >
      {error ? <Banner kind="error" message={error} /> : null}
      {info ? <Banner kind="success" message={info} /> : null}

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Minimum 8 characters"
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
      />
      <Field
        label="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter your password"
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
      />

      <PrimaryButton label="Create Account" onPress={onSubmit} loading={loading} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },
});
