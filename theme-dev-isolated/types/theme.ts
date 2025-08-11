export type ThemeType = 'default' | 'comic' | 'startrek';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  colors: ColorPalette;
  fonts: FontConfig;
  animations: AnimationConfig;
  sounds: SoundConfig;
  layout: LayoutConfig;
  assets: AssetConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  panel: string;
  border: string;
  muted: string;
  [key: string]: string;
}

export interface FontConfig {
  heading: string;
  body: string;
  display?: string;
  accent?: string;
}

export interface AnimationConfig {
  pageTransition: string;
  contentReveal: string;
  interactive: string;
  background: string;
}

export interface SoundConfig {
  enabled: boolean;
  effects: string[];
  ambient?: string;
  voice?: string;
}

export interface LayoutConfig {
  type: 'comic-panel' | 'lcars' | 'default';
  grid: string;
  spacing: string;
  borderRadius: string;
}

export interface AssetConfig {
  fonts: string[];
  sounds: string[];
  images: string[];
  animations: string[];
}

export interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themeConfig: ThemeConfig;
  isLoading: boolean;
}
