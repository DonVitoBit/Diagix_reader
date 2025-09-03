import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import type { Book } from '@/types/supabase';

export function Prefetch() {
  const queryClient = useQueryClient();
  const recentBooks = useStore(state => state.recentBooks);

  useEffect(() => {
    // Предварительная загрузка списка книг
    queryClient.prefetchQuery({
      queryKey: ['books'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('title');
        if (error) throw error;
        return data as Book[];
      },
      staleTime: 5 * 60 * 1000, // 5 минут
    });

    // Предварительная загрузка недавних книг
    recentBooks.forEach(bookId => {
      queryClient.prefetchQuery({
        queryKey: ['books', bookId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();
          if (error) throw error;
          return data as Book;
        },
        staleTime: 5 * 60 * 1000,
      });

      // Предварительная загрузка прогресса чтения
      queryClient.prefetchQuery({
        queryKey: ['progress', bookId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('book_id', bookId)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          return data;
        },
        staleTime: 1 * 60 * 1000, // 1 минута
      });
    });
  }, [recentBooks]);

  return null;
}
