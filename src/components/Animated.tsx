import React, { useEffect } from 'react';
import { Animated as RNAnimated, ViewStyle, Platform } from 'react-native';
import { useNavigation } from 'expo-router';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
}

export function FadeInView({
  children,
  style,
  delay = 0,
  duration = 300,
}: FadeInViewProps) {
  const opacity = React.useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <RNAnimated.View style={[{ opacity }, style]}>
      {children}
    </RNAnimated.View>
  );
}

interface SlideInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  delay?: number;
  duration?: number;
}

export function SlideInView({
  children,
  style,
  direction = 'up',
  distance = 50,
  delay = 0,
  duration = 300,
}: SlideInViewProps) {
  const translation = React.useRef(new RNAnimated.Value(distance)).current;

  useEffect(() => {
    RNAnimated.timing(translation, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const getTransform = () => {
    switch (direction) {
      case 'left':
        return [{ translateX: translation }];
      case 'right':
        return [{ translateX: RNAnimated.multiply(translation, -1) }];
      case 'up':
        return [{ translateY: translation }];
      case 'down':
        return [{ translateY: RNAnimated.multiply(translation, -1) }];
    }
  };

  return (
    <RNAnimated.View style={[{ transform: getTransform() }, style]}>
      {children}
    </RNAnimated.View>
  );
}

export function useScreenTransition() {
  const navigation = useNavigation();

  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    navigation.setOptions({
      animation: 'slide_from_right',
      animationDuration: 300,
    });
  }, [navigation]);
}
