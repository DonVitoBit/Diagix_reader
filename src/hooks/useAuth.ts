import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';

const PUBLIC_ROUTES = ['/auth'];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Подписываемся на изменения состояния авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          if (pathname === '/auth') {
            router.replace('/');
          }
        } else if (event === 'SIGNED_OUT') {
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.replace('/auth');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user && !PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/auth');
        return;
      }

      if (user) {
        // Проверяем права администратора
        const { data: isAdminUser } = await supabase.rpc('is_admin', {
          user_id: user.id,
        });
        setIsAdmin(isAdminUser);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    isLoading,
    isAdmin,
    signOut,
  };
}
