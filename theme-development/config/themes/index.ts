import { ThemeConfig } from '../../types/theme';

export const themeConfigs: Record<string, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default Theme',
    description: 'Clean, modern design',
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#8b5cf6',
      background: '#ffffff',
      foreground: '#1f2937',
      panel: '#f9fafb',
      border: '#e5e7eb',
      muted: '#6b7280'
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    animations: {
      pageTransition: 'fade',
      contentReveal: 'slide-up',
      interactive: 'scale',
      background: 'none'
    },
    sounds: {
      enabled: false,
      effects: []
    },
    layout: {
      type: 'default',
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      spacing: 'gap-6',
      borderRadius: 'rounded-lg'
    },
    assets: {
      fonts: [],
      sounds: [],
      images: [],
      animations: []
    }
  },
  comic: {
    id: 'comic',
    name: 'Superman Comic Book',
    description: 'Golden Age comic book aesthetic',
    colors: {
      primary: '#FF0000',    // Superman red
      secondary: '#0066CC',  // Superman blue
      accent: '#FFD700',     // Golden yellow
      background: '#FFFFFF',
      foreground: '#000000',
      panel: '#F0F0F0',
      border: '#000000',
      muted: '#666666',
      speechBubble: '#FFFFFF',
      thoughtCloud: '#E8F4FD',
      soundEffect: '#FF0000'
    },
    fonts: {
      heading: 'Action Comics, serif',
      body: 'Comic Sans MS, sans-serif',
      display: 'Impact, sans-serif'
    },
    animations: {
      pageTransition: 'comic-page-turn',
      contentReveal: 'panel-reveal',
      interactive: 'pow-effect',
      background: 'halftone-pattern'
    },
    sounds: {
      enabled: true,
      effects: ['pow', 'bam', 'zap', 'boom', 'wham']
    },
    layout: {
      type: 'comic-panel',
      grid: 'comic-grid',
      spacing: 'comic-spacing',
      borderRadius: 'comic-border'
    },
    assets: {
      fonts: ['action-comics', 'comic-book'],
      sounds: ['pow.mp3', 'bam.mp3', 'zap.mp3'],
      images: ['comic-pattern.png', 'halftone.png'],
      animations: ['page-turn', 'panel-reveal']
    }
  },
  startrek: {
    id: 'startrek',
    name: 'Star Trek LCARS',
    description: 'Computer console interface',
    colors: {
      primary: '#FF6600',    // LCARS orange
      secondary: '#0066CC',  // LCARS blue
      accent: '#CCCCCC',     // LCARS gray
      background: '#000000',
      foreground: '#FFFFFF',
      panel: '#1A1A1A',
      border: '#333333',
      muted: '#666666',
      alert: '#FF0000',
      status: '#00FF00',
      warning: '#FFFF00'
    },
    fonts: {
      heading: 'Federation Standard, monospace',
      body: 'Computer Terminal, monospace',
      display: 'LCARS Display, monospace'
    },
    animations: {
      pageTransition: 'holographic-fade',
      contentReveal: 'scanning-line',
      interactive: 'computer-beep',
      background: 'circuit-pattern'
    },
    sounds: {
      enabled: true,
      effects: ['beep', 'alert', 'scan'],
      voice: 'computer-voice'
    },
    layout: {
      type: 'lcars',
      grid: 'lcars-grid',
      spacing: 'lcars-spacing',
      borderRadius: 'lcars-border'
    },
    assets: {
      fonts: ['federation-standard', 'computer-terminal'],
      sounds: ['beep.mp3', 'alert.mp3', 'scan.mp3'],
      images: ['lcars-pattern.png', 'circuit-board.png'],
      animations: ['scanning', 'holographic']
    }
  }
};
