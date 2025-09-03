import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const BOOKS_DIRECTORY = `${FileSystem.documentDirectory}diagix/books/`;

interface UseOfflineBookProps {
  signedUrl: string;
  checksum: string;
  ext: string;
}

interface UseOfflineBookResult {
  localUri: string | null;
  isDownloaded: boolean;
  isDownloading: boolean;
  progress: number;
  download: () => Promise<void>;
  remove: () => Promise<void>;
  error: Error | null;
}

export function useOfflineBook({
  signedUrl,
  checksum,
  ext,
}: UseOfflineBookProps): UseOfflineBookResult {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const fileName = `${checksum}.${ext}`;
  const localPath = `${BOOKS_DIRECTORY}${fileName}`;

  // Проверяем существование директории и файла при монтировании
  useEffect(() => {
    checkFile();
  }, []);

  async function checkFile() {
    try {
      // Проверяем существование директории
      const dirInfo = await FileSystem.getInfoAsync(BOOKS_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BOOKS_DIRECTORY, { intermediates: true });
      }

      // Проверяем существование файла
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        setLocalUri(fileInfo.uri);
      }
    } catch (err) {
      console.error('Error checking file:', err);
      setError(err as Error);
    }
  }

  async function download() {
    if (Platform.OS === 'web') {
      setError(new Error('Downloading is not supported on web'));
      return;
    }

    try {
      setIsDownloading(true);
      setProgress(0);
      setError(null);

      const downloadResumable = FileSystem.createDownloadResumable(
        signedUrl,
        localPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(progress);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      setLocalUri(uri);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err as Error);
    } finally {
      setIsDownloading(false);
    }
  }

  async function remove() {
    try {
      if (localUri) {
        await FileSystem.deleteAsync(localUri);
        setLocalUri(null);
      }
    } catch (err) {
      console.error('Error removing file:', err);
      setError(err as Error);
    }
  }

  return {
    localUri,
    isDownloaded: !!localUri,
    isDownloading,
    progress,
    download,
    remove,
    error,
  };
}
