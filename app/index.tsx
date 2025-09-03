import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/Button';
import { theme, typography, spacing } from '@/styles/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diagix Reader</Text>
      <Text style={styles.subtitle}>Читайте книги в удобном формате</Text>
      
      <View style={styles.buttons}>
        <Link href="/auth" asChild>
          <Button title="Войти" />
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    color: theme.light.text,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    color: theme.light.textSecondary,
  },
  buttons: {
    gap: spacing.md,
  },
});