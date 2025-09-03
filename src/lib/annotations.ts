import { supabase } from './supabase';

export type HighlightColor = 'yellow' | 'green' | 'blue';
export type BookmarkCategory = 'important' | 'todo' | 'favorite' | 'question' | 'other';

export interface Bookmark {
  id?: string;
  user_id: string;
  book_id: string;
  cfi: string;
  note?: string;
  category: BookmarkCategory;
  created_at?: string;
}

export interface Highlight {
  id?: string;
  user_id: string;
  book_id: string;
  cfi_range: string;
  color: HighlightColor;
  text: string;
  note?: string;
  page_number?: number; // Для PDF
  created_at?: string;
}

export const categoryIcons = {
  important: '⚠️',
  todo: '📝',
  favorite: '⭐',
  question: '❓',
  other: '📌',
};

export const categoryLabels = {
  important: 'Важное',
  todo: 'Сделать',
  favorite: 'Избранное',
  question: 'Вопрос',
  other: 'Другое',
};

export async function searchAnnotations(
  userId: string,
  query: string
): Promise<{ bookmarks: Bookmark[]; highlights: Highlight[] }> {
  try {
    const [bookmarksResult, highlightsResult] = await Promise.all([
      supabase
        .from('bookmarks')
        .select('*, books!inner(title)')
        .eq('user_id', userId)
        .ilike('note', `%${query}%`),
      supabase
        .from('highlights')
        .select('*, books!inner(title)')
        .eq('user_id', userId)
        .or(`text.ilike.%${query}%,note.ilike.%${query}%`),
    ]);

    return {
      bookmarks: bookmarksResult.data || [],
      highlights: highlightsResult.data || [],
    };
  } catch (error) {
    console.error('Error searching annotations:', error);
    return { bookmarks: [], highlights: [] };
  }
}

export async function createBookmark(
  bookmark: Omit<Bookmark, 'id' | 'created_at'>
): Promise<Bookmark | null> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ ...bookmark, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return null;
  }
}

export async function getBookmarks(
  userId: string,
  bookId: string,
  category?: BookmarkCategory
): Promise<Bookmark[]> {
  try {
    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }
}

export async function createHighlight(
  highlight: Omit<Highlight, 'id' | 'created_at'>
): Promise<Highlight | null> {
  try {
    const { data, error } = await supabase
      .from('highlights')
      .insert([{ ...highlight, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating highlight:', error);
    return null;
  }
}

export async function getHighlights(
  userId: string,
  bookId: string,
  color?: HighlightColor
): Promise<Highlight[]> {
  try {
    let query = supabase
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (color) {
      query = query.eq('color', color);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return [];
  }
}

// ... остальные функции остаются без изменений ...