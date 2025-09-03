import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { UISettingsProvider } from '@/contexts/UISettingsContext';

// Инициализация Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 1.0,
});

// Конфигурация React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 30 * 60 * 1000, // 30 минут
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UISettingsProvider>
        <Sentry.TouchEventBoundary>
          {children}
        </Sentry.TouchEventBoundary>
      </UISettingsProvider>
    </QueryClientProvider>
  );
}
