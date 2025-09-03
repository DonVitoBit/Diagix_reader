import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

async function initDatabase() {
  try {
    // Создаем таблицы
    const { error: profilesError } = await supabase.rpc('init_profiles_table');
    if (profilesError) throw profilesError;

    const { error: booksError } = await supabase.rpc('init_books_table');
    if (booksError) throw booksError;

    const { error: progressError } = await supabase.rpc('init_progress_table');
    if (progressError) throw progressError;

    const { error: bookmarksError } = await supabase.rpc('init_bookmarks_table');
    if (bookmarksError) throw bookmarksError;

    const { error: highlightsError } = await supabase.rpc('init_highlights_table');
    if (highlightsError) throw highlightsError;

    const { error: reportsError } = await supabase.rpc('init_reports_table');
    if (reportsError) throw reportsError;

    // Создаем бакеты для хранения файлов
    const { error: booksStorageError } = await supabase.storage.createBucket('books', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'application/epub+zip'],
      fileSizeLimit: 100000000, // 100MB
    });
    if (booksStorageError) throw booksStorageError;

    const { error: coversStorageError } = await supabase.storage.createBucket('covers', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      fileSizeLimit: 5000000, // 5MB
    });
    if (coversStorageError) throw coversStorageError;

    console.log('База данных успешно инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
  }
}

initDatabase();
