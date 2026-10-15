import { Platform } from 'react-native';
import { GalleryTheme } from './types';

export const obsidianTheme: GalleryTheme = {
  id: 'obsidian',
  name: '黑曜石展厅 (Obsidian Gallery)',
  isDark: true,
  colors: {
    canvas: '#070709',          // Extremely deep dark with slight cool undertone
    surface: '#121216',         // Secondary backplate
    surfaceElevated: '#1A1A21', // Floating cards and modals
    surfaceGlass: 'rgba(20, 20, 26, 0.82)', // Frosted glass backdrops
    
    borderSubtle: 'rgba(255, 255, 255, 0.07)',
    borderFocus: 'rgba(255, 255, 255, 0.22)',
    
    textPrimary: '#F6F6F8',
    textSecondary: '#9A9AA6',
    textTertiary: '#5C5C68',
    textInverse: '#070709',
    
    accent: '#E5C158',          // Refined champagne warm gold
    accentDim: 'rgba(229, 193, 88, 0.12)',
    accentRed: '#E63946',       // Leica style red highlight
    accentBlue: '#60A5FA',      // Coordinate / map touch
    
    ambientBackdrop: 'rgba(0, 0, 0, 0.92)',
    vignetteOverlay: 'rgba(7, 7, 9, 0.65)',
  },
  typography: {
    fontSerif: Platform.select({
      ios: 'Baskerville',
      android: 'serif',
      default: 'Georgia, serif',
    }),
    fontSans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    fontMono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Consolas, monospace',
    }),
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    full: 9999,
  },
};

// 预留的暖白/纸质摄影志主题接口 (随时可扩充启用)
export const ivoryTheme: GalleryTheme = {
  id: 'ivory',
  name: '纸质摄影志 (Warm Ivory)',
  isDark: false,
  colors: {
    canvas: '#F7F5F0',
    surface: '#EFECE4',
    surfaceElevated: '#FFFFFF',
    surfaceGlass: 'rgba(247, 245, 240, 0.85)',
    
    borderSubtle: 'rgba(0, 0, 0, 0.08)',
    borderFocus: 'rgba(0, 0, 0, 0.25)',
    
    textPrimary: '#1E1E24',
    textSecondary: '#66666E',
    textTertiary: '#9E9EA8',
    textInverse: '#FFFFFF',
    
    accent: '#B8860B',
    accentDim: 'rgba(184, 134, 11, 0.12)',
    accentRed: '#C1272D',
    accentBlue: '#2563EB',
    
    ambientBackdrop: 'rgba(247, 245, 240, 0.95)',
    vignetteOverlay: 'rgba(0, 0, 0, 0.35)',
  },
  typography: {
    fontSerif: Platform.select({ ios: 'Baskerville', android: 'serif', default: 'Georgia, serif' }),
    fontSans: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
    fontMono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  spacing: obsidianTheme.spacing,
  radius: obsidianTheme.radius,
};
