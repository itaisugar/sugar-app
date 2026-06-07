import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { AuthShell } from '../../components/auth/AuthShell';
import { Field, PrimaryButton, GoogleButton, Divider, Banner } from '../../components/auth/FormPrimitives';
import { useAuth } from '../../lib/AuthContext';
import { Colors, Fonts } from '../../constants/Theme';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
    }
    // On success, AuthGate routes to onboarding or the feed based on `onboarded`.
  };

  const onGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setError(error);
    // On success, onAuthStateChange updates the session and AuthGate routes.
  };

  return (
    <AuthShell
      kicker="Welcome Back"
      title="Sign in to Sapience"
      subtitle="Continue your daily practice of distilled, high-signal knowledge."
      footer={
        <Text style={styles.footerText}>
          New here?{' '}
          <Link href="/(auth)/signup" style={styles.link}>
            Create an account
          </Link>
        </Text>
      }
    >
      {error ? <Banner kind="error" message={error} /> : null}

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
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
      />

      <View style={{ alignItems: 'flex-end' }}>
        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>
      </View>

      <PrimaryButton label="Sign In" onPress={onSubmit} loading={loading} />

      <Divider label="or" />

      <GoogleButton
        label="Continue with Google"
        onPress={onGoogle}
        loading={googleLoading}
        disabled={loading}
      />
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
  forgotLink: {
    color: Colors.primary,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
});
