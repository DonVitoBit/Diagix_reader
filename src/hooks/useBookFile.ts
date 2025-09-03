import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOfflineBook } from './useOfflineBook';

interface UseBookFileResult {
  fileUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useBookFile(bookId: string): UseBookFileResult {
  const [book, setBook] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { localUri, isDownloaded } = useOfflineBook(
    book ? {
      signedUrl: signedUrl!,
      checksum: book.checksum,
      ext: book.format,
    } : {
      signedUrl: '',
      checksum: '',
      ext: '',
    }
  );

  useEffect(() => {
    loadBook();
  }, [bookId]);

  async function loadBook() {
    try {
      setIsLoading(true);
      setError(null);

      // Загружаем информацию о книге
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

      // Получаем подписанный URL
      const { data: { signedUrl }, error: urlError } = await supabase
        .storage
        .from('books')
        .createSignedUrl(bookData.file_path, 24 * 60 * 60);

      if (urlError) throw urlError;
      setSignedUrl(signedUrl);
    } catch (err) {
      console.error('Error loading book:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    fileUrl: isDownloaded ? localUri : signedUrl,
    isLoading,
    error,
  };
}
