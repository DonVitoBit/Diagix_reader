import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  Easing,
} from 'react-native';
import { BRAND_COLOR, theme, typography } from '@/styles/theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Загрузка...' }: LoadingScreenProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  const rotation = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.8)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация вращения
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Анимация появления
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [{ scale }, { rotate: spin }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logo,
              { backgroundColor: BRAND_COLOR },
            ]}
          />
        </View>
      </Animated.View>
      
      <Animated.Text
        style={[
          styles.message,
          {
            color: colors.text,
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  content: {
    width: 64,
    height: 64,
  },
  logoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  message: {
    ...typography.body,
  },
});
