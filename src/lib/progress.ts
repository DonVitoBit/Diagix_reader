import { supabase } from './supabase';

export interface ReadingProgress {
  user_id: string;
  book_id: string;
  loc: string; // CFI для EPUB или номер страницы для PDF
  percent: number;
  updated_at?: string;
}

/**
 * Получить прогресс чтения для конкретной книги
 */
export async function getProgress(userId: string, bookId: string): Promise<ReadingProgress | null> {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching reading progress:', error);
    return null;
  }
}

/**
 * Обновить или создать запись о прогрессе чтения
 */
export async function upsertProgress(progress: Omit<ReadingProgress, 'updated_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('progress')
      .upsert(
        {
          ...progress,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,book_id',
        }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error saving reading progress:', error);
  }
}

/**
 * Получить последние прочитанные книги пользователя
 */
export async function getRecentBooks(userId: string, limit = 5): Promise<ReadingProgress[]> {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent books:', error);
    return [];
  }
}
