export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          language: string;
          format: 'epub' | 'pdf';
          cover_url: string;
          file_path: string;
          checksum: string;
          size_bytes: number;
          year: number | null;
          isbn: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Tables['books']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Tables['books']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Tables['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Tables['profiles']['Insert']>;
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          loc: string;
          percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Tables['progress']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Tables['progress']['Insert']>;
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          cfi: string;
          note: string | null;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Tables['bookmarks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Tables['bookmarks']['Insert']>;
      };
      highlights: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          cfi_range: string;
          text: string;
          color: string;
          note: string | null;
          page_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Tables['highlights']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Tables['highlights']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      book_format: 'epub' | 'pdf';
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type BookFormat = Enums<'book_format'>;
export type Book = Tables<'books'>;
export type Profile = Tables<'profiles'>;
export type Progress = Tables<'progress'>;
export type Bookmark = Tables<'bookmarks'>;
export type Highlight = Tables<'highlights'>;
