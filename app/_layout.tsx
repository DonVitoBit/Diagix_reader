import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { UISettingsProvider } from '@/contexts/UISettingsContext';

export default function RootLayout() {
  useEffect(() => {
    LogBox.ignoreLogs(['Warning: ...']); // Игнорируем предупреждения в dev режиме
  }, []);

  return (
    <UISettingsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </UISettingsProvider>
  );
}