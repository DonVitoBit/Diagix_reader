import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/Button';
import { theme, typography, spacing } from '@/styles/theme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Diagix Reader
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Читайте книги в удобном формате
        </Text>
        
        <View style={styles.buttons}>
          <Link href="/auth" asChild>
            <Button title="Войти" />
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.md,
  },
});