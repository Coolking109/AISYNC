'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'es' | 'fr' | 'de';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  actualTheme: 'light' | 'dark'; // The resolved theme (auto becomes light/dark)
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, token, updateUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('en');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  // Update actual theme based on theme setting
  useEffect(() => {
    if (theme === 'auto') {
      setActualTheme(getSystemTheme());
    } else {
      setActualTheme(theme);
    }
  }, [theme]);

  // Listen for system theme changes when auto mode is enabled
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Load user preferences
  useEffect(() => {
    if (user?.preferences) {
      setThemeState(user.preferences.theme as Theme || 'dark');
      setLanguageState(user.preferences.language as Language || 'en');
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', actualTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(actualTheme);
    }
  }, [actualTheme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Update user preferences if logged in
    if (token && user) {
      try {
        const updatedPreferences = {
          ...user.preferences,
          theme: newTheme,
        };
        
        const response = await fetch('/api/auth/update-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedPreferences),
        });
        
        if (response.ok) {
          // Update user context with new preferences
          updateUser({ 
            preferences: updatedPreferences
          });
        }
      } catch (error) {
        console.error('Failed to update theme preference:', error);
      }
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    
    // Update user preferences if logged in
    if (token && user) {
      try {
        const updatedPreferences = {
          ...user.preferences,
          language: newLanguage,
        };
        
        const response = await fetch('/api/auth/update-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedPreferences),
        });
        
        if (response.ok) {
          // Update user context with new preferences
          updateUser({ 
            preferences: updatedPreferences
          });
        }
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };

  const value: ThemeContextType = {
    theme,
    language,
    actualTheme,
    setTheme,
    setLanguage,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
