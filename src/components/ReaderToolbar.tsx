import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface ReaderToolbarProps {
  bookId: string;
  title: string;
  onAddBookmark: () => void;
}

export function ReaderToolbar({ bookId, title, onAddBookmark }: ReaderToolbarProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onAddBookmark}
      >
        <Text style={styles.buttonText}>Добавить закладку</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`/notes?bookId=${bookId}&title=${encodeURIComponent(title)}`)}
      >
        <Text style={styles.buttonText}>Заметки</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});
