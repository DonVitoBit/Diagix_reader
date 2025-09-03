import React, { Suspense } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { BookList } from '@/components/BookList';
import { useStore } from '@/store';
import { theme, spacing } from '@/styles/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import type { Book } from '@/types/supabase';

// Ленивая загрузка тяжелых компонентов
const RecentBooks = React.lazy(() => import('@/components/RecentBooks'));
const CollectionsList = React.lazy(() => import('@/components/CollectionsList'));

export default function LibraryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const { reset } = useQueryErrorResetBoundary();
  
  // Получаем состояние из глобального хранилища
  const addRecentBook = useStore(state => state.addRecentBook);
  const favoriteBooks = useStore(state => state.favoriteBooks);
  const toggleFavorite = useStore(state => state.toggleFavorite);

  const handleBookPress = (book: Book) => {
    addRecentBook(book.id);
    router.push(`/reader?id=${book.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorBoundary
        onReset={reset}
        fallback={({ error, resetErrorBoundary }) => (
          <ErrorScreen error={error} onRetry={resetErrorBoundary} />
        )}
      >
        <Suspense fallback={<LoadingScreen />}>
          {/* Недавние книги */}
          <RecentBooks
            style={styles.section}
            onBookPress={handleBookPress}
          />

          {/* Коллекции */}
          <CollectionsList
            style={styles.section}
            onBookPress={handleBookPress}
          />

          {/* Основной список книг */}
          <BookList
            onBookPress={handleBookPress}
            renderItem={(book) => (
              <BookCard
                book={book}
                isFavorite={favoriteBooks.has(book.id)}
                onFavoritePress={() => toggleFavorite(book.id)}
                onPress={() => handleBookPress(book)}
              />
            )}
          />
        </Suspense>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
});