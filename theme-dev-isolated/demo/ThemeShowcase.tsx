'use client';

import React, { useState } from 'react';
import { useTheme } from '../components/shared/ThemeProvider';
import ThemeSwitcher from '../components/shared/ThemeSwitcher';
import ComicBookDemo from './ComicBookDemo';
import StarTrekDemo from './StarTrekDemo';
import SimpleAIGenerator from './SimpleAIGenerator';

const DefaultDemo: React.FC = () => {
  return (
    <div className="demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="demo-title">Default Theme</h1>
          <p className="demo-description">
            Clean, modern design with excellent readability and accessibility.
          </p>
        </div>

        <div className="demo-content">
          <div style={{ 
            background: 'var(--color-panel)', 
            border: '2px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2>Welcome to the Theme Showcase</h2>
            <p>
              This is the default theme with a clean, modern design. Use the theme switcher 
              in the top-right corner to explore the comic book and Star Trek themes!
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div style={{ 
              background: 'var(--color-panel)', 
              border: '2px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3>Feature 1</h3>
              <p>Clean typography and spacing for optimal readability.</p>
            </div>

            <div style={{ 
              background: 'var(--color-panel)', 
              border: '2px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3>Feature 2</h3>
              <p>Responsive design that works on all devices.</p>
            </div>

            <div style={{ 
              background: 'var(--color-panel)', 
              border: '2px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3>Feature 3</h3>
              <p>Accessible design following WCAG guidelines.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeShowcase: React.FC = () => {
  const { currentTheme, isLoading } = useTheme();
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-background)',
        color: 'var(--color-foreground)'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading theme...</p>
      </div>
    );
  }

  const renderDemo = () => {
    if (showAIGenerator) {
      return <SimpleAIGenerator />;
    }

    switch (currentTheme) {
      case 'comic':
        return <ComicBookDemo />;
      case 'startrek':
        return <StarTrekDemo />;
      default:
        return <DefaultDemo />;
    }
  };

  return (
    <div style={{ background: 'var(--color-background)', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setShowAIGenerator(!showAIGenerator)}
          style={{
            padding: '8px 16px',
            backgroundColor: showAIGenerator ? '#ef4444' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showAIGenerator ? 'Hide AI Generator' : 'Show AI Generator'}
        </button>
        {!showAIGenerator && <ThemeSwitcher />}
      </div>
      {renderDemo()}
    </div>
  );
};

export default ThemeShowcase;
