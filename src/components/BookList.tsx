import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useVirtualList } from '@/hooks/useVirtualList';
import { BookCard } from './BookCard';
import { useBooks } from '@/api/queries';
import { spacing } from '@/styles/theme';
import type { Book } from '@/types/supabase';

interface BookListProps {
  filter?: (book: Book) => boolean;
  onBookPress?: (book: Book) => void;
}

const CARD_MARGIN = spacing.md;
const MIN_CARD_WIDTH = 200;

export function BookList({ filter, onBookPress }: BookListProps) {
  const { data: books = [], isLoading } = useBooks();
  const { width } = useWindowDimensions();

  // Вычисляем количество колонок на основе ширины экрана
  const columns = Math.max(1, Math.floor(width / (MIN_CARD_WIDTH + CARD_MARGIN * 2)));
  const cardWidth = (width - CARD_MARGIN * (columns + 1)) / columns;

  // Фильтруем и группируем книги по строкам
  const rows = useMemo(() => {
    const filteredBooks = filter ? books.filter(filter) : books;
    const rows = [];
    for (let i = 0; i < filteredBooks.length; i += columns) {
      rows.push(filteredBooks.slice(i, i + columns));
    }
    return rows;
  }, [books, columns, filter]);

  const { VirtualList } = useVirtualList({
    data: rows,
    estimatedItemSize: cardWidth * 1.5 + CARD_MARGIN * 2,
    keyExtractor: (row) => row.map(book => book.id).join('-'),
    renderItem: (row, rowIndex) => (
      <View style={styles.row}>
        {row.map((book, colIndex) => (
          <View
            key={book.id}
            style={[
              styles.cardContainer,
              {
                width: cardWidth,
                marginLeft: colIndex === 0 ? CARD_MARGIN : 0,
                marginRight: CARD_MARGIN,
              },
            ]}
          >
            <BookCard
              book={book}
              onPress={() => onBookPress?.(book)}
              style={{ width: '100%' }}
            />
          </View>
        ))}
        {/* Добавляем пустые места, если в последней строке не хватает книг */}
        {rowIndex === rows.length - 1 && row.length < columns && (
          [...Array(columns - row.length)].map((_, i) => (
            <View
              key={`empty-${i}`}
              style={[
                styles.cardContainer,
                {
                  width: cardWidth,
                  marginRight: CARD_MARGIN,
                },
              ]}
            />
          ))
        )}
      </View>
    ),
    style: styles.list,
    contentContainerStyle: styles.content,
  });

  return <VirtualList />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingVertical: CARD_MARGIN,
  },
  row: {
    flexDirection: 'row',
    marginBottom: CARD_MARGIN,
  },
  cardContainer: {
    height: '100%',
  },
});
