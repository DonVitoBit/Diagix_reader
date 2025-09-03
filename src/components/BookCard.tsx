import React from 'react';
import { View, Text, Image, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from './Card';
import { Button } from './Button';
import { SlideInView } from './Animated';
import { theme, typography, spacing, radius } from '@/styles/theme';
import { useOfflineBook } from '@/hooks/useOfflineBook';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  format: 'epub' | 'pdf';
  file_path: string;
  checksum: string;
}

interface BookCardProps {
  book: Book;
  index: number;
  signedUrl: string;
}

export function BookCard({ book, index, signedUrl }: BookCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  const {
    isDownloaded,
    isDownloading,
    progress,
    download,
    remove,
  } = useOfflineBook({
    signedUrl,
    checksum: book.checksum,
    ext: book.format,
  });

  const handleDownload = async () => {
    if (isDownloaded) {
      await remove();
    } else {
      await download();
    }
  };

  return (
    <SlideInView
      delay={index * 100}
      style={styles.wrapper}
    >
      <Card
        variant="elevated"
        style={[
          styles.card,
          { backgroundColor: colors.surface }
        ]}
      >
        <Image
          source={{ uri: book.cover_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <View style={styles.info}>
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
            <Text
              style={[styles.format, { color: colors.textSecondary }]}
            >
              {book.format.toUpperCase()}
            </Text>
            <View style={styles.buttons}>
              <Button
                title={isDownloaded ? 'Удалить' : isDownloading ? `${Math.round(progress * 100)}%` : 'Скачать'}
                variant="secondary"
                size="small"
                onPress={handleDownload}
                disabled={isDownloading}
                style={styles.downloadButton}
              />
              <Button
                title="Читать"
                variant="primary"
                size="small"
                onPress={() => router.push(`/reader?id=${book.id}`)}
              />
            </View>
          </View>
        </View>
      </Card>
    </SlideInView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    maxWidth: '50%',
    marginBottom: spacing.md,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 0.67,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  info: {
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
    gap: spacing.sm,
  },
  format: {
    ...typography.bodySmall,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  downloadButton: {
    flex: 1,
  },
});
