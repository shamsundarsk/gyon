/**
 * Theme Toggle Component
 * Provides theme switching functionality (light/dark mode)
 * Validates: Requirements 1.1
 */

import React, { useState, useEffect } from 'react';
import { userPreferencesService, UserPreferences } from '../services/UserPreferencesService';
import './ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    userPreferencesService.getPreferences()
  );
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    userPreferencesService.getEffectiveTheme()
  );

  useEffect(() => {
    // Subscribe to preference changes
    const unsubscribe = userPreferencesService.subscribe((newPreferences) => {
      setPreferences(newPreferences);
      setEffectiveTheme(userPreferencesService.getEffectiveTheme());
    });

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (preferences.theme === 'auto') {
        setEffectiveTheme(userPreferencesService.getEffectiveTheme());
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      unsubscribe();
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [preferences.theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.className = effectiveTheme;
  }, [effectiveTheme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    userPreferencesService.updatePreference('theme', newTheme);
  };

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(preferences.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    handleThemeChange(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (preferences.theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🔄';
      default:
        return '🔄';
    }
  };

  const getThemeLabel = () => {
    switch (preferences.theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Auto';
    }
  };

  return (
    <div className={`theme-toggle ${className}`}>
      <button
        className="theme-toggle-btn"
        onClick={cycleTheme}
        title={`Current theme: ${getThemeLabel()}. Click to cycle themes.`}
        aria-label={`Switch theme. Current: ${getThemeLabel()}`}
      >
        <span className="theme-icon">{getThemeIcon()}</span>
        <span className="theme-label">{getThemeLabel()}</span>
      </button>
      
      <div className="theme-options">
        <button
          className={`theme-option ${preferences.theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          title="Light theme"
        >
          ☀️ Light
        </button>
        <button
          className={`theme-option ${preferences.theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          title="Dark theme"
        >
          🌙 Dark
        </button>
        <button
          className={`theme-option ${preferences.theme === 'auto' ? 'active' : ''}`}
          onClick={() => handleThemeChange('auto')}
          title="Auto theme (follows system)"
        >
          🔄 Auto
        </button>
      </div>
    </div>
  );
};