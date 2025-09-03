import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FileDropzone } from './FileDropzone';
import { theme, typography, spacing } from '@/styles/theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';

interface ImportData {
  title: string;
  author: string;
  language?: string;
  isbn?: string;
  year?: string;
}

export function BulkOperations() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const queryClient = useQueryClient();
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Получаем список книг
  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Мутация для массового удаления
  const bulkDelete = useMutation({
    mutationFn: async (bookIds: string[]) => {
      // Сначала удаляем файлы из storage
      const books = await supabase
        .from('books')
        .select('file_path, cover_url')
        .in('id', bookIds);

      if (books.data) {
        await Promise.all(
          books.data.map(async (book) => {
            await supabase.storage.from('books').remove([book.file_path]);
            if (book.cover_url) {
              const coverPath = book.cover_url.split('/').pop();
              if (coverPath) {
                await supabase.storage.from('covers').remove([coverPath]);
              }
            }
          })
        );
      }

      // Затем удаляем записи из базы
      const { error } = await supabase
        .from('books')
        .delete()
        .in('id', bookIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBooks([]);
    },
  });

  // Обработчик импорта CSV
  const handleImport = async (result: DocumentPicker.DocumentResult) => {
    if (result.type !== 'success') return;

    try {
      setImporting(true);
      const content = await FileSystem.readAsStringAsync(result.uri);
      
      Papa.parse(content, {
        header: true,
        complete: async (results) => {
          const data = results.data as ImportData[];
          
          for (const book of data) {
            try {
              await supabase.from('books').insert([{
                title: book.title,
                author: book.author,
                language: book.language || 'en',
                isbn: book.isbn,
                year: book.year ? parseInt(book.year) : null,
                format: 'epub', // Значение по умолчанию
                cover_url: '', // Будет обновлено позже
                file_path: '', // Будет обновлено позже
                checksum: '', // Будет обновлено позже
                size_bytes: 0, // Будет обновлено позже
              }]);
            } catch (error) {
              console.error('Error importing book:', book.title, error);
            }
          }

          queryClient.invalidateQueries({ queryKey: ['books'] });
          Alert.alert('Успех', `Импортировано ${data.length} книг`);
        },
        error: (error) => {
          Alert.alert('Ошибка', 'Не удалось импортировать данные');
          console.error('CSV parse error:', error);
        },
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось прочитать файл');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  // Обработчик экспорта
  const handleExport = async () => {
    if (!books) return;

    const csv = Papa.unparse(
      books.map(book => ({
        title: book.title,
        author: book.author,
        language: book.language,
        format: book.format,
        isbn: book.isbn,
        year: book.year,
      }))
    );

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'books.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const path = `${FileSystem.documentDirectory}books.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      Alert.alert('Успех', `Файл сохранен: ${path}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Массовые операции
      </Text>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Импорт книг
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Загрузите CSV файл со списком книг. Формат: title, author, language, isbn, year
        </Text>
        <FileDropzone
          accept={['text/csv']}
          onFilePick={handleImport}
          title="Перетащите CSV файл"
          subtitle="или нажмите для выбора"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Экспорт книг
        </Text>
        <Button
          title="Экспортировать в CSV"
          onPress={handleExport}
          style={styles.button}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Удаление книг
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Выбрано книг: {selectedBooks.length}
        </Text>
        <Button
          title="Удалить выбранные книги"
          onPress={() => {
            if (selectedBooks.length === 0) {
              Alert.alert('Ошибка', 'Выберите книги для удаления');
              return;
            }

            Alert.alert(
              'Подтверждение',
              `Удалить ${selectedBooks.length} книг?`,
              [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Удалить',
                  style: 'destructive',
                  onPress: () => bulkDelete.mutate(selectedBooks),
                },
              ]
            );
          }}
          variant="outline"
          style={styles.button}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
});
