import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBook, useReadingProgress, useUpdateProgress } from '@/api/queries';
import { useStore } from '@/store';
import { OptimizedPDFViewer } from '@/components/OptimizedPDFViewer';
import { EPUBReader } from '@/components/EPUBReader';
import { ReaderControls } from '@/components/ReaderControls';
import { ReaderToolbar } from '@/components/ReaderToolbar';
import { useBookFile } from '@/hooks/useBookFile';
import { theme } from '@/styles/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  // Получаем данные с помощью React Query
  const { data: book, isLoading: bookLoading } = useBook(id as string);
  const { data: progress } = useReadingProgress(id as string);
  const { mutate: updateProgress } = useUpdateProgress();
  
  // Получаем файл книги (локальный или удаленный)
  const { fileUrl, isLoading: fileLoading } = useBookFile(id as string);

  // Получаем настройки из глобального хранилища
  const readerSettings = useStore(state => state.readerSettings);
  const setReaderSettings = useStore(state => state.setReaderSettings);

  // Добавляем книгу в недавние при открытии
  const addRecentBook = useStore(state => state.addRecentBook);
  useEffect(() => {
    if (book) {
      addRecentBook(book.id);
    }
  }, [book?.id]);

  // Обработчик изменения прогресса
  const handleProgressChange = React.useCallback((loc: string, percent: number) => {
    if (!book) return;
    
    updateProgress({
      user_id: supabase.auth.user()!.id,
      book_id: book.id,
      loc,
      percent,
    });
  }, [book]);

  if (bookLoading || fileLoading) {
    return <LoadingScreen />;
  }

  if (!book || !fileUrl) {
    return null;
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {book.format === 'pdf' ? (
          <OptimizedPDFViewer
            uri={fileUrl}
            initialPage={progress?.loc ? parseInt(progress.loc) : 1}
            onPageChange={(page) => {
              handleProgressChange(
                page.toString(),
                (page / book.total_pages) * 100
              );
            }}
          />
        ) : (
          <EPUBReader
            uri={fileUrl}
            initialLocation={progress?.loc}
            settings={readerSettings}
            onLocationChange={(loc, percent) => {
              handleProgressChange(loc, percent * 100);
            }}
          />
        )}

        <ReaderToolbar
          bookId={book.id}
          title={book.title}
          onClose={() => router.back()}
        />

        <ReaderControls
          settings={readerSettings}
          onSettingsChange={setReaderSettings}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});