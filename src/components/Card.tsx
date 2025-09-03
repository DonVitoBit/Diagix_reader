import React from 'react';
import { View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { theme, radius, elevation } from '@/styles/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          ...(variant === 'elevated' ? elevation.medium : {}),
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
  },
});
