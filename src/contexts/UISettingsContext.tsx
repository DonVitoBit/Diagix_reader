import React, { createContext, useContext, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'sepia';

interface UISettings {
  theme: Theme;
  fontSize: number;
  lineHeight: number;
}

interface UISettingsContextType extends UISettings {
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  incrementFontSize: () => void;
  decrementFontSize: () => void;
}

const defaultSettings: UISettings = {
  theme: 'light',
  fontSize: 18,
  lineHeight: 1.6,
};

const UISettingsContext = createContext<UISettingsContextType | null>(null);

export const themeStyles = {
  light: {
    background: '#ffffff',
    text: '#1a1a1a',
    link: '#0ea5e9',
  },
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    link: '#38bdf8',
  },
  sepia: {
    background: '#f1e7d0',
    text: '#433422',
    link: '#875f3b',
  },
};

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);

  const setTheme = useCallback((theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    if (fontSize >= 16 && fontSize <= 22) {
      setSettings(prev => ({ ...prev, fontSize }));
    }
  }, []);

  const setLineHeight = useCallback((lineHeight: number) => {
    if (lineHeight >= 1.4 && lineHeight <= 1.8) {
      setSettings(prev => ({ ...prev, lineHeight }));
    }
  }, []);

  const incrementFontSize = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(prev.fontSize + 1, 22),
    }));
  }, []);

  const decrementFontSize = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(prev.fontSize - 1, 16),
    }));
  }, []);

  return (
    <UISettingsContext.Provider
      value={{
        ...settings,
        setTheme,
        setFontSize,
        setLineHeight,
        incrementFontSize,
        decrementFontSize,
      }}
    >
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettings must be used within a UISettingsProvider');
  }
  return context;
}

// Хук для получения CSS-стилей для текущей темы
export function useThemeStyles() {
  const { theme, fontSize, lineHeight } = useUISettings();
  return {
    ...themeStyles[theme],
    fontSize,
    lineHeight,
  };
}
