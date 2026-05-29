import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Colors, Spacing, Radius, TextStyles, Shadow } from '../../constants/Theme';

export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footer,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
          <View style={styles.brand}>
            <Text style={TextStyles.appTitle}>
              Sapience<Text style={{ color: Colors.primary }}>.</Text>
            </Text>
            <Text style={[TextStyles.tagline, { marginTop: 8 }]}>
              An exclusive library for the relentlessly curious.
            </Text>
          </View>

          <View style={styles.card}>
            {kicker ? (
              <Text style={[TextStyles.kicker, { marginBottom: 10 }]}>{kicker}</Text>
            ) : null}
            <Text style={TextStyles.heroTitle}>{title}</Text>
            {subtitle ? (
              <Text style={[TextStyles.body, { marginTop: 12 }]}>{subtitle}</Text>
            ) : null}

            <View style={styles.form}>{children}</View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadow.sm,
  },
  form: {
    marginTop: Spacing.lg,
    gap: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
