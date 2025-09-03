import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { Providers } from '@/providers';

export default function App() {
  return (
    <Providers>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </Providers>
  );
}