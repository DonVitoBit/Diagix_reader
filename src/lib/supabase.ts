import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://uqkrawkngjmvucarjrcm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxa3Jhd2tuZ2ptdnVjYXJqcmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTc2NjQsImV4cCI6MjA3MjQ5MzY2NH0.7uLfY74viBoZBx-IBvk7CoNueQ2u-aRVE4l0fJvBi3o';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});