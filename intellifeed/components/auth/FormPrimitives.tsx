import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Theme';

export function Field({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        placeholderTextColor={Colors.textMuted}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          inputProps.style,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.primaryBtn, isDisabled && styles.primaryBtnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={styles.ghostBtn}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Banner({
  kind,
  message,
}: {
  kind: 'error' | 'success' | 'info';
  message: string;
}) {
  const map = {
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  } as const;
  const palette = map[kind];
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.bannerText, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textPrimary,
    letterSpacing: 0.4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    color: '#DC2626',
  },
  primaryBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.6,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts.sansSemibold,
    letterSpacing: 0.6,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ghostBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: Fonts.sansSemibold,
    letterSpacing: 0.3,
  },
  banner: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    lineHeight: 18,
  },
});
