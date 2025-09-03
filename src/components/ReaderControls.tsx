import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { theme, elevation, spacing } from '@/styles/theme';
import type { Theme } from '@/contexts/UISettingsContext';

interface ReaderControlsProps {
  onThemeChange?: (theme: Theme) => void;
  onFontSizeChange?: (increase: boolean) => void;
  currentFontSize?: number;
}

export function ReaderControls({
  onThemeChange,
  onFontSizeChange,
  currentFontSize,
}: ReaderControlsProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <Card
        variant="elevated"
        style={[
          styles.controls,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.themeButtons}>
            <Button
              title="A"
              variant="outline"
              size="small"
              onPress={() => onThemeChange?.('light')}
              style={styles.themeButton}
            />
            <Button
              title="A"
              variant="outline"
              size="small"
              onPress={() => onThemeChange?.('sepia')}
              style={[styles.themeButton, { backgroundColor: '#F1E7D0' }]}
            />
            <Button
              title="A"
              variant="outline"
              size="small"
              onPress={() => onThemeChange?.('dark')}
              style={[styles.themeButton, { backgroundColor: '#1A1E23' }]}
            />
          </View>

          <View style={styles.fontButtons}>
            <Button
              title="A-"
              variant="secondary"
              size="small"
              onPress={() => onFontSizeChange?.(false)}
              disabled={currentFontSize === 16}
            />
            <Button
              title="A+"
              variant="secondary"
              size="small"
              onPress={() => onFontSizeChange?.(true)}
              disabled={currentFontSize === 22}
            />
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
  },
  controls: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeButton: {
    width: 40,
    height: 40,
  },
  fontButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});