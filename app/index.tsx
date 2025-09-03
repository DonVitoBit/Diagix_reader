import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { BookCard } from '@/components/BookCard';
import { FadeInView } from '@/components/Animated';
import { theme, spacing } from '@/styles/theme';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  format: 'epub' | 'pdf';
  file_path: string;
  checksum: string;
}

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const [books, setBooks] = useState<(Book & { signedUrl: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title');

      if (error) throw error;

      // Получаем подписанные URL для каждой книги
      const booksWithUrls = await Promise.all(
        (data || []).map(async (book) => {
          const { data: { signedUrl }, error: urlError } = await supabase
            .storage
            .from('books')
            .createSignedUrl(book.file_path, 24 * 60 * 60); // URL действителен 24 часа

          if (urlError) throw urlError;
          return { ...book, signedUrl };
        })
      );

      setBooks(booksWithUrls);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FadeInView style={styles.content}>
        <FlatList
          data={books}
          renderItem={({ item, index }) => (
            <BookCard
              book={item}
              index={index}
              signedUrl={item.signedUrl}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
        />
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
});