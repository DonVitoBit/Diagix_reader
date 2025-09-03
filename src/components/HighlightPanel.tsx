import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { HighlightColor } from '@/lib/annotations';

interface HighlightPanelProps {
  onHighlight: (color: HighlightColor, note?: string) => void;
  onCancel: () => void;
}

export function HighlightPanel({ onHighlight, onCancel }: HighlightPanelProps) {
  const [note, setNote] = useState('');
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');

  const colors: HighlightColor[] = ['yellow', 'green', 'blue'];

  const colorStyles = {
    yellow: { backgroundColor: 'rgba(255, 235, 59, 0.3)' },
    green: { backgroundColor: 'rgba(76, 175, 80, 0.3)' },
    blue: { backgroundColor: 'rgba(33, 150, 243, 0.3)' },
  };

  return (
    <View style={styles.container}>
      <View style={styles.colors}>
        {colors.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              colorStyles[color],
              selectedColor === color && styles.selectedColor,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Добавить заметку (необязательно)"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
      />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.highlightButton]}
          onPress={() => onHighlight(selectedColor, note || undefined)}
        >
          <Text style={[styles.buttonText, styles.highlightButtonText]}>
            Выделить
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
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
  colors: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#0ea5e9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  highlightButtonText: {
    color: 'white',
  },
});
