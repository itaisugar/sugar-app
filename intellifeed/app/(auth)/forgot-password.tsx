import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { AuthShell } from '../../components/auth/AuthShell';
import { Field, PrimaryButton, Banner } from '../../components/auth/FormPrimitives';
import { useAuth } from '../../lib/AuthContext';
import { Colors, Fonts } from '../../constants/Theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email) {
      setError('Please enter the email associated with your account.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  return (
    <AuthShell
      kicker="Recover Access"
      title="Reset your password"
      subtitle="Enter your email and we'll send you a secure link to set a new password."
      footer={
        <Text style={styles.footerText}>
          Remembered it?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Back to sign in
          </Link>
        </Text>
      }
    >
      {error ? <Banner kind="error" message={error} /> : null}
      {sent ? (
        <Banner
          kind="success"
          message="If that email exists in our system, a reset link is on its way. Please check your inbox."
        />
      ) : null}

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        editable={!sent}
      />

      <PrimaryButton
        label={sent ? 'Email Sent' : 'Send Reset Link'}
        onPress={onSubmit}
        loading={loading}
        disabled={sent}
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
});
