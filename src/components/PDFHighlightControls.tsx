import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import type { HighlightColor } from '@/lib/annotations';

interface PDFHighlightControlsProps {
  onHighlight: (color: HighlightColor, note?: string) => void;
  onCancel: () => void;
  selectedText: string;
  pageNumber: number;
}

export function PDFHighlightControls({
  onHighlight,
  onCancel,
  selectedText,
  pageNumber,
}: PDFHighlightControlsProps) {
  const [note, setNote] = useState('');
  const [color, setColor] = useState<HighlightColor>('yellow');

  const colors: { value: HighlightColor; label: string }[] = [
    { value: 'yellow', label: 'Жёлтый' },
    { value: 'green', label: 'Зелёный' },
    { value: 'blue', label: 'Синий' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Выделить текст</Text>
      
      <View style={styles.content}>
        <Text style={styles.label}>Выбранный текст:</Text>
        <Text style={styles.selectedText} numberOfLines={3}>
          {selectedText}
        </Text>
        <Text style={styles.pageNumber}>Страница {pageNumber}</Text>

        <Text style={styles.label}>Цвет выделения:</Text>
        <View style={styles.colors}>
          {colors.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.colorButton,
                { backgroundColor: value === 'yellow' ? '#fff9c4' :
                                 value === 'green' ? '#c8e6c9' : '#bbdefb' },
                color === value && styles.selectedColor,
              ]}
              onPress={() => setColor(value)}
            >
              <Text style={styles.colorLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Заметка (необязательно):</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Добавьте заметку к выделению..."
          multiline
          maxLength={500}
        />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.highlightButton]}
          onPress={() => onHighlight(color, note || undefined)}
        >
          <Text style={styles.highlightButtonText}>Выделить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: Platform.OS === 'web' ? 400 : '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedText: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  pageNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  colors: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  colorButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#0ea5e9',
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  highlightButton: {
    backgroundColor: '#0ea5e9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  highlightButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
