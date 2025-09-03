import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { theme, typography, spacing, radius, BRAND_COLOR } from '@/styles/theme';
import { TouchableScale } from '@/components/TouchableScale';
import * as DocumentPicker from 'expo-document-picker';

interface FileDropzoneProps {
  onFilePick: (result: DocumentPicker.DocumentResult) => void;
  accept?: string[];
  maxSize?: number;
  title?: string;
  subtitle?: string;
}

export function FileDropzone({
  onFilePick,
  accept = ['*/*'],
  maxSize,
  title = 'Перетащите файл сюда',
  subtitle = 'или нажмите для выбора',
}: FileDropzoneProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const [isDragging, setIsDragging] = useState(false);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept,
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        if (maxSize && result.size > maxSize) {
          alert(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`);
          return;
        }
        onFilePick(result);
      }
    } catch (err) {
      console.error('Error picking file:', err);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: isDragging ? BRAND_COLOR : colors.border,
          },
        ]}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          
          const file = e.dataTransfer.files[0];
          if (!file) return;

          if (maxSize && file.size > maxSize) {
            alert(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`);
            return;
          }

          onFilePick({
            type: 'success',
            name: file.name,
            size: file.size,
            uri: URL.createObjectURL(file),
            mimeType: file.type,
          });
        }}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    );
  }

  return (
    <TouchableScale onPress={handleFilePick}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Выбрать файл
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {accept.join(', ')}
        </Text>
      </View>
    </TouchableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
});
