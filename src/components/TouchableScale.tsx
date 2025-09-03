import React from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';

interface TouchableScaleProps extends PressableProps {
  children: React.ReactNode;
  scale?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function TouchableScale({
  children,
  scale = 0.95,
  style,
  contentContainerStyle,
  ...props
}: TouchableScaleProps) {
  const animated = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(animated, {
      toValue: scale,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animated, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  return (
    <Pressable
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View
        style={[
          contentContainerStyle,
          {
            transform: [{ scale: animated }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
