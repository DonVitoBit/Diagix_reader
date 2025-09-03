import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme, typography, spacing, radius } from '@/styles/theme';
import { computeChecksum, extractEpubMetadata, extractPdfMetadata } from '@/lib/utils';

interface BookFormData {
  title: string;
  author: string;
  language: string;
  year?: string;
  isbn?: string;
}

export function AdminBookForm() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    language: 'ru',
  });
  const [bookFile, setBookFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [coverFile, setCoverFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickBook = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/epub+zip', 'application/pdf'],
      });

      if (result.type === 'success') {
        setBookFile(result);
        
        // Автоматически извлекаем метаданные
        const ext = result.name.split('.').pop()?.toLowerCase();
        if (ext === 'epub') {
          const metadata = await extractEpubMetadata(result.uri);
          setFormData(prev => ({
            ...prev,
            title: metadata.title || prev.title,
            author: metadata.author || prev.author,
            language: metadata.language || prev.language,
            year: metadata.year?.toString() || prev.year,
            isbn: metadata.isbn || prev.isbn,
          }));
        } else if (ext === 'pdf') {
          const metadata = await extractPdfMetadata(result.uri);
          setFormData(prev => ({
            ...prev,
            title: metadata.title || prev.title,
            author: metadata.author || prev.author,
            language: metadata.language || prev.language,
          }));
        }
      }
    } catch (err) {
      console.error('Error picking book:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить файл книги');
    }
  };

  const handlePickCover = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
      });

      if (result.type === 'success') {
        setCoverFile(result);
      }
    } catch (err) {
      console.error('Error picking cover:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить обложку');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!bookFile || bookFile.type !== 'success') {
        throw new Error('Выберите файл книги');
      }

      // Вычисляем контрольную сумму файла
      const checksum = await computeChecksum(bookFile.uri);
      const ext = bookFile.name.split('.').pop()?.toLowerCase();

      // Загружаем файл книги
      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(`${checksum}.${ext}`, await FileSystem.readAsStringAsync(bookFile.uri, { encoding: FileSystem.EncodingType.Base64 }), {
          contentType: ext === 'epub' ? 'application/epub+zip' : 'application/pdf',
        });

      if (uploadError) throw uploadError;

      // Загружаем обложку
      let coverUrl = '';
      if (coverFile && coverFile.type === 'success') {
        const { data: coverData, error: coverError } = await supabase.storage
          .from('covers')
          .upload(`${checksum}.jpg`, await FileSystem.readAsStringAsync(coverFile.uri, { encoding: FileSystem.EncodingType.Base64 }), {
            contentType: 'image/jpeg',
          });

        if (coverError) throw coverError;
        coverUrl = supabase.storage.from('covers').getPublicUrl(coverData.path).data.publicUrl;
      }

      // Создаем запись в базе данных
      const { error: dbError } = await supabase
        .from('books')
        .insert([
          {
            title: formData.title,
            author: formData.author,
            language: formData.language,
            format: ext as 'epub' | 'pdf',
            cover_url: coverUrl,
            file_path: `${checksum}.${ext}`,
            checksum,
            size_bytes: bookFile.size,
            year: formData.year ? parseInt(formData.year) : null,
            isbn: formData.isbn,
          },
        ]);

      if (dbError) throw dbError;

      // Очищаем форму
      setFormData({
        title: '',
        author: '',
        language: 'ru',
      });
      setBookFile(null);
      setCoverFile(null);

      Alert.alert('Успех', 'Книга успешно добавлена');
    } catch (err) {
      console.error('Error submitting book:', err);
      setError(err.message);
      Alert.alert('Ошибка', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Добавить книгу
      </Text>

      <View style={styles.form}>
        <Input
          label="Название"
          value={formData.title}
          onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
          error={error}
        />

        <Input
          label="Автор"
          value={formData.author}
          onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
          error={error}
        />

        <Input
          label="Язык"
          value={formData.language}
          onChangeText={(value) => setFormData(prev => ({ ...prev, language: value }))}
          error={error}
        />

        <Input
          label="Год издания"
          value={formData.year}
          onChangeText={(value) => setFormData(prev => ({ ...prev, year: value }))}
          keyboardType="numeric"
        />

        <Input
          label="ISBN"
          value={formData.isbn}
          onChangeText={(value) => setFormData(prev => ({ ...prev, isbn: value }))}
        />

        <View style={styles.fileButtons}>
          <Button
            title={bookFile ? 'Файл выбран' : 'Выбрать файл книги'}
            onPress={handlePickBook}
            variant={bookFile ? 'secondary' : 'primary'}
            style={styles.fileButton}
          />

          <Button
            title={coverFile ? 'Обложка выбрана' : 'Выбрать обложку'}
            onPress={handlePickCover}
            variant={coverFile ? 'secondary' : 'primary'}
            style={styles.fileButton}
          />
        </View>

        <Button
          title="Добавить книгу"
          onPress={handleSubmit}
          loading={loading}
          disabled={!formData.title || !formData.author || !bookFile}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fileButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
