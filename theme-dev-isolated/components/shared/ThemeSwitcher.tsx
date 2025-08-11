'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { ThemeType } from '../../types/theme';

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, isLoading } = useTheme();

  const themes: { id: ThemeType; name: string; icon: string }[] = [
    { id: 'default', name: 'Default', icon: '🎨' },
    { id: 'comic', name: 'Comic Book', icon: '🦸' },
    { id: 'startrek', name: 'Star Trek', icon: '🚀' }
  ];

  if (isLoading) {
    return (
      <div className="theme-switcher loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="theme-switcher">
      <div className="theme-switcher-label">Choose Theme:</div>
      <div className="theme-buttons">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-button ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => setTheme(theme.id)}
            aria-label={`Switch to ${theme.name} theme`}
          >
            <span className="theme-icon">{theme.icon}</span>
            <span className="theme-name">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
