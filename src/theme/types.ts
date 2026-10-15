export interface GalleryTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    // Canvas & backgrounds
    canvas: string;          // Pure deep dark base, e.g. #09090B
    surface: string;         // Slightly elevated layer, e.g. #141417
    surfaceElevated: string; // Cards & modals, e.g. #1C1C21
    surfaceGlass: string;    // Translucent blur overlay, e.g. rgba(22, 22, 28, 0.75)
    
    // Borders & dividers
    borderSubtle: string;    // Thin fine borders, e.g. rgba(255, 255, 255, 0.08)
    borderFocus: string;     // Active states, e.g. rgba(255, 255, 255, 0.25)
    
    // Typography
    textPrimary: string;     // #F5F5F7
    textSecondary: string;   // #A1A1A9
    textTertiary: string;    // #63636E
    textInverse: string;     // #000000 for high-contrast badge text
    
    // Accents & curation tags
    accent: string;          // Gold / Leica-inspired champagne highlight #D4AF37
    accentDim: string;       // rgba(212, 175, 55, 0.15)
    accentRed: string;       // Leica classic red dot touch #D92B2B
    accentBlue: string;      // Geographic / coordinate accent #3B82F6
    
    // Special effects
    ambientBackdrop: string; // Ambient shadow tone
    vignetteOverlay: string; // Gradient overlay for photo covers
  };
  typography: {
    fontSerif: string;       // Serif font family for monograph titles
    fontSans: string;        // Clean sans-serif for UI
    fontMono: string;        // Monospace for EXIF and technical timestamps
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}
