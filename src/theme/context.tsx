import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GalleryTheme } from './types';
import { obsidianTheme, ivoryTheme } from './obsidian';

interface ThemeContextType {
  theme: GalleryTheme;
  themeId: string;
  setThemeId: (id: string) => void;
  availableThemes: GalleryTheme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: obsidianTheme,
  themeId: 'obsidian',
  setThemeId: () => {},
  availableThemes: [obsidianTheme, ivoryTheme],
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>('obsidian');

  const availableThemes = [obsidianTheme, ivoryTheme];
  const theme = availableThemes.find(t => t.id === themeId) || obsidianTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
