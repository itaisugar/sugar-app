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
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Radius, TextStyles, Fonts } from '../../constants/Theme';

export function Field({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={TextStyles.inputLabel}>{label}</Text> : null}
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
          TextStyles.inputValue,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          inputProps.style,
        ]}
      />
      {error ? <Text style={TextStyles.error}>{error}</Text> : null}
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
        <Text style={TextStyles.buttonPrimary}>{label}</Text>
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
      <Text style={TextStyles.buttonGhost}>{label}</Text>
    </TouchableOpacity>
  );
}

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export function GoogleButton({
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
      activeOpacity={0.7}
      style={[styles.googleBtn, isDisabled && styles.googleBtnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <>
          <GoogleLogo />
          <Text style={styles.googleLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
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
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  primaryBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.55,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  googleBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
  },
  googleBtnDisabled: {
    opacity: 0.55,
  },
  googleLabel: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 15,
    color: '#1F1F1F',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  banner: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
  bannerText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
});
