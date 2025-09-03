import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { Providers } from '@/providers';
import { Prefetch } from '@/components/Prefetch';
import { useStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/LoadingScreen';
import { theme } from '@/styles/theme';

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 300,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  fullScreenGestureEnabled: true,
  
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

export default function RootLayout() {
  const currentTheme = useStore(state => state.readerSettings.theme);
  const colors = theme[currentTheme === 'dark' ? 'dark' : 'light'];
  const { isLoading } = useAuth();

  useEffect(() => {
    LogBox.ignoreLogs(['Warning: ...']);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Providers>
      <Prefetch />
      <Stack
        screenOptions={{
          ...screenOptions,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="auth"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </Providers>
  );
}