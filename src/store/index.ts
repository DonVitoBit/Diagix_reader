import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { immer } from 'zustand/middleware/immer';
import type { BookFormat } from '@/types/supabase';

interface ReaderSettings {
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
  margin: number;
}

interface AppState {
  // Настройки чтения
  readerSettings: ReaderSettings;
  setReaderSettings: (settings: Partial<ReaderSettings>) => void;
  
  // Кэш для оффлайн файлов
  offlineBooks: {
    [key: string]: {
      localUri: string;
      format: BookFormat;
      size: number;
      lastAccessed: string;
    };
  };
  addOfflineBook: (bookId: string, data: AppState['offlineBooks'][string]) => void;
  removeOfflineBook: (bookId: string) => void;
  
  // Последние открытые книги
  recentBooks: string[];
  addRecentBook: (bookId: string) => void;
  
  // Избранные книги
  favoriteBooks: Set<string>;
  toggleFavorite: (bookId: string) => void;
  
  // Коллекции
  collections: {
    [key: string]: {
      name: string;
      books: string[];
    };
  };
  createCollection: (name: string) => void;
  addToCollection: (collectionId: string, bookId: string) => void;
  removeFromCollection: (collectionId: string, bookId: string) => void;
}

const MAX_RECENT_BOOKS = 10;

export const useStore = create<AppState>()(
  persist(
    immer((set) => ({
      readerSettings: {
        theme: 'light',
        fontSize: 18,
        fontFamily: 'System',
        lineHeight: 1.5,
        letterSpacing: 0,
        margin: 16,
      },
      setReaderSettings: (settings) =>
        set((state) => {
          Object.assign(state.readerSettings, settings);
        }),

      offlineBooks: {},
      addOfflineBook: (bookId, data) =>
        set((state) => {
          state.offlineBooks[bookId] = data;
        }),
      removeOfflineBook: (bookId) =>
        set((state) => {
          delete state.offlineBooks[bookId];
        }),

      recentBooks: [],
      addRecentBook: (bookId) =>
        set((state) => {
          state.recentBooks = [
            bookId,
            ...state.recentBooks.filter((id) => id !== bookId),
          ].slice(0, MAX_RECENT_BOOKS);
        }),

      favoriteBooks: new Set(),
      toggleFavorite: (bookId) =>
        set((state) => {
          if (state.favoriteBooks.has(bookId)) {
            state.favoriteBooks.delete(bookId);
          } else {
            state.favoriteBooks.add(bookId);
          }
        }),

      collections: {},
      createCollection: (name) =>
        set((state) => {
          const id = crypto.randomUUID();
          state.collections[id] = {
            name,
            books: [],
          };
        }),
      addToCollection: (collectionId, bookId) =>
        set((state) => {
          if (!state.collections[collectionId].books.includes(bookId)) {
            state.collections[collectionId].books.push(bookId);
          }
        }),
      removeFromCollection: (collectionId, bookId) =>
        set((state) => {
          state.collections[collectionId].books = state.collections[
            collectionId
          ].books.filter((id) => id !== bookId);
        }),
    })),
    {
      name: 'diagix-reader-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
