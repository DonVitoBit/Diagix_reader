import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import type { BookmarkCategory } from '@/lib/annotations';
import { categoryIcons, categoryLabels } from '@/lib/annotations';

interface BookmarkDialogProps {
  onSave: (note: string, category: BookmarkCategory) => void;
  onCancel: () => void;
}

export function BookmarkDialog({ onSave, onCancel }: BookmarkDialogProps) {
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>('other');

  const categories = Object.entries(categoryLabels) as [BookmarkCategory, string][];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Добавить закладку</Text>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Категория:</Text>
        <View style={styles.categories}>
          {categories.map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.categoryButton,
                category === value && styles.selectedCategory,
              ]}
              onPress={() => setCategory(value)}
            >
              <Text style={styles.categoryIcon}>{categoryIcons[value]}</Text>
              <Text style={[
                styles.categoryLabel,
                category === value && styles.selectedCategoryLabel,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Заметка (необязательно):</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Добавьте заметку к закладке..."
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => onSave(note, category)}
        >
          <Text style={styles.saveButtonText}>Сохранить</Text>
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
    maxHeight: '80%',
    width: Platform.OS === 'web' ? 400 : '90%',
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
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: '45%',
  },
  selectedCategory: {
    backgroundColor: '#0ea5e9',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
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
  saveButton: {
    backgroundColor: '#0ea5e9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
