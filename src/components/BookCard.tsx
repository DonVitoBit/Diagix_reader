import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { TouchableScale } from './TouchableScale';
import { OptimizedImage } from './OptimizedImage';
import { theme, typography, spacing, radius, elevation } from '@/styles/theme';
import type { Book } from '@/types/supabase';

interface BookCardProps {
  book: Book;
  isFavorite?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  onFavoritePress?: () => void;
}

export function BookCard({
  book,
  isFavorite,
  style,
  onPress,
  onFavoritePress,
}: BookCardProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <TouchableScale
      onPress={onPress}
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.card,
        {
          backgroundColor: colors.surface,
          ...elevation.medium,
        },
      ]}
    >
      <OptimizedImage
        uri={book.cover_url}
        style={styles.cover}
        cacheKey={book.checksum}
      />
      
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        
        <Text
          style={[styles.author, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>

        <View style={styles.footer}>
          <View
            style={[
              styles.formatBadge,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Text
              style={[
                styles.formatText,
                { color: colors.textSecondary },
              ]}
            >
              {book.format.toUpperCase()}
            </Text>
          </View>

          {onFavoritePress && (
            <TouchableScale
              onPress={onFavoritePress}
              scale={0.8}
              style={styles.favoriteButton}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorite ? '★' : '☆'}
              </Text>
            </TouchableScale>
          )}
        </View>
      </View>
    </TouchableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 0.67,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  formatText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  favoriteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#FFD700',
  },
});