import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
  TextInputProps,
} from 'react-native';
import { theme, radius, typography } from '@/styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.text },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
            borderColor: error ? '#EF4444' : colors.border,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...typography.bodySmall,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    ...typography.body,
  },
  error: {
    ...typography.bodySmall,
    color: '#EF4444',
    marginTop: 4,
  },
});
