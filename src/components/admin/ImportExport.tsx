import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FileDropzone } from './FileDropzone';
import { theme, typography, spacing } from '@/styles/theme';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { computeChecksum } from '@/lib/utils';

interface ImportProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
}

export function ImportExport() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  // Функция для создания ZIP архива с книгами
  const createExportZip = async () => {
    const zip = new JSZip();

    // Получаем все книги
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .order('title');

    if (!books) return null;

    // Создаем CSV с метаданными
    const csv = Papa.unparse(
      books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        language: book.language,
        format: book.format,
        isbn: book.isbn,
        year: book.year,
        checksum: book.checksum,
      }))
    );
    zip.file('metadata.csv', csv);

    // Добавляем файлы книг
    for (const book of books) {
      try {
        const { data } = await supabase.storage
          .from('books')
          .download(book.file_path);
        
        if (data) {
          zip.file(`books/${book.file_path}`, data);
        }

        // Добавляем обложки
        if (book.cover_url) {
          const coverPath = book.cover_url.split('/').pop();
          if (coverPath) {
            const { data: coverData } = await supabase.storage
              .from('covers')
              .download(coverPath);
            
            if (coverData) {
              zip.file(`covers/${coverPath}`, coverData);
            }
          }
        }
      } catch (error) {
        console.error(`Error adding book ${book.id} to zip:`, error);
      }
    }

    return zip;
  };

  // Обработчик экспорта
  const handleExport = async () => {
    try {
      const zip = await createExportZip();
      if (!zip) {
        Alert.alert('Ошибка', 'Не удалось создать архив');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'library-export.zip';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const path = `${FileSystem.documentDirectory}library-export.zip`;
        await FileSystem.writeAsStringAsync(
          path,
          await content.text(),
          { encoding: FileSystem.EncodingType.Base64 }
        );
        Alert.alert('Успех', `Архив сохранен: ${path}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Ошибка', 'Не удалось экспортировать библиотеку');
    }
  };

  // Обработчик импорта
  const handleImport = async (result: DocumentPicker.DocumentResult) => {
    if (result.type !== 'success') return;

    try {
      setImporting(true);
      setProgress({ total: 0, current: 0, success: 0, failed: 0 });

      const content = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const zip = await JSZip.loadAsync(content, { base64: true });
      
      // Читаем метаданные
      const metadataFile = zip.file('metadata.csv');
      if (!metadataFile) {
        throw new Error('Metadata file not found');
      }

      const metadata = Papa.parse(await metadataFile.async('text'), {
        header: true,
      }).data;

      setProgress(prev => prev ? { ...prev, total: metadata.length } : null);

      // Импортируем книги
      for (const [index, book] of metadata.entries()) {
        try {
          setProgress(prev => prev ? { ...prev, current: index + 1 } : null);

          // Проверяем, существует ли книга
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .eq('checksum', book.checksum)
            .single();

          if (existingBook) {
            setProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
            continue;
          }

          // Загружаем файл книги
          const bookFile = zip.file(`books/${book.file_path}`);
          if (!bookFile) {
            throw new Error('Book file not found');
          }

          const bookData = await bookFile.async('blob');
          const { error: uploadError } = await supabase.storage
            .from('books')
            .upload(book.file_path, bookData);

          if (uploadError) throw uploadError;

          // Загружаем обложку
          let coverUrl = '';
          const coverPath = `${book.checksum}.jpg`;
          const coverFile = zip.file(`covers/${coverPath}`);
          
          if (coverFile) {
            const coverData = await coverFile.async('blob');
            const { error: coverError } = await supabase.storage
              .from('covers')
              .upload(coverPath, coverData);

            if (!coverError) {
              coverUrl = supabase.storage
                .from('covers')
                .getPublicUrl(coverPath)
                .data.publicUrl;
            }
          }

          // Создаем запись в базе
          const { error: dbError } = await supabase
            .from('books')
            .insert([{
              ...book,
              cover_url: coverUrl,
              size_bytes: bookData.size,
            }]);

          if (dbError) throw dbError;

          setProgress(prev => prev ? { ...prev, success: prev.success + 1 } : null);
        } catch (error) {
          console.error(`Error importing book ${book.title}:`, error);
          setProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['books'] });
      Alert.alert(
        'Импорт завершен',
        `Успешно: ${progress?.success}\nОшибок: ${progress?.failed}`
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Ошибка', 'Не удалось импортировать библиотеку');
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Импорт/Экспорт библиотеки
      </Text>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Экспорт библиотеки
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Экспортирует все книги, обложки и метаданные в ZIP архив
        </Text>
        <Button
          title="Экспортировать библиотеку"
          onPress={handleExport}
          style={styles.button}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Импорт библиотеки
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Импортирует книги из ZIP архива. Поддерживает частичный импорт
        </Text>
        
        {importing ? (
          <View style={styles.progress}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Импорт: {progress?.current} из {progress?.total}
            </Text>
            <Text style={[styles.progressStats, { color: colors.textSecondary }]}>
              Успешно: {progress?.success} • Ошибок: {progress?.failed}
            </Text>
          </View>
        ) : (
          <FileDropzone
            accept={['application/zip']}
            onFilePick={handleImport}
            title="Перетащите ZIP архив"
            subtitle="или нажмите для выбора"
          />
        )}
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
  progress: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  progressText: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  progressStats: {
    ...typography.body,
  },
});
