import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchAnnotations, categoryIcons, categoryLabels } from '@/lib/annotations';
import type { Bookmark, Highlight } from '@/lib/annotations';

interface SearchResult {
  type: 'bookmark' | 'highlight';
  bookTitle: string;
  content: string;
  note?: string;
  category?: string;
  color?: string;
  id: string;
  bookId: string;
  cfi: string;
}

interface AnnotationSearchProps {
  userId: string;
  onClose?: () => void;
}

export function AnnotationSearch({ userId, onClose }: AnnotationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { bookmarks, highlights } = await searchAnnotations(userId, query);

      const formattedResults: SearchResult[] = [
        ...bookmarks.map((bookmark: any) => ({
          type: 'bookmark',
          bookTitle: bookmark.books.title,
          content: bookmark.note || 'Без заметки',
          category: bookmark.category,
          id: bookmark.id,
          bookId: bookmark.book_id,
          cfi: bookmark.cfi,
        })),
        ...highlights.map((highlight: any) => ({
          type: 'highlight',
          bookTitle: highlight.books.title,
          content: highlight.text,
          note: highlight.note,
          color: highlight.color,
          id: highlight.id,
          bookId: highlight.book_id,
          cfi: highlight.cfi_range,
        })),
      ];

      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, userId]);

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        router.push(`/reader?id=${item.bookId}&cfi=${encodeURIComponent(item.cfi)}`);
        onClose?.();
      }}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.bookTitle}>{item.bookTitle}</Text>
        {item.type === 'bookmark' && item.category && (
          <Text style={styles.category}>
            {categoryIcons[item.category]} {categoryLabels[item.category]}
          </Text>
        )}
        {item.type === 'highlight' && (
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color === 'yellow' ? '#ffeb3b' :
                               item.color === 'green' ? '#4caf50' : '#2196f3' },
            ]}
          />
        )}
      </View>
      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
      {item.note && (
        <Text style={styles.note} numberOfLines={1}>{item.note}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Поиск по заметкам и выделениям..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Найти</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query ? 'Ничего не найдено' : 'Введите текст для поиска'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  resultItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
  },
  content: {
    fontSize: 15,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
});
