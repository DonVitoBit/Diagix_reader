import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Book, Progress, Bookmark, Highlight } from '@/types/supabase';

// Книги
export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as Book[];
    },
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Book;
    },
  });
}

export function useSearchBooks(query: string) {
  return useQuery({
    queryKey: ['books', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .textSearch('ts', query)
        .order('title');
      if (error) throw error;
      return data as Book[];
    },
    enabled: query.length > 0,
  });
}

// Прогресс чтения
export function useReadingProgress(bookId: string) {
  return useQuery({
    queryKey: ['progress', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('book_id', bookId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Progress | null;
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (progress: Omit<Progress, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('progress')
        .upsert(progress)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['progress', data.book_id] });
    },
  });
}

// Закладки
export function useBookmarks(bookId: string) {
  return useQuery({
    queryKey: ['bookmarks', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Bookmark[];
    },
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmark)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', data.book_id] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, bookId };
    },
    onSuccess: ({ bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', bookId] });
    },
  });
}

// Выделения
export function useHighlights(bookId: string) {
  return useQuery({
    queryKey: ['highlights', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Highlight[];
    },
  });
}

export function useCreateHighlight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (highlight: Omit<Highlight, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('highlights')
        .insert(highlight)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', data.book_id] });
    },
  });
}

export function useUpdateHighlight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Highlight, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data: updated, error } = await supabase
        .from('highlights')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', data.book_id] });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, bookId };
    },
    onSuccess: ({ bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', bookId] });
    },
  });
}
