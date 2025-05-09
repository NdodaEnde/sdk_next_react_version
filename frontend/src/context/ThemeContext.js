import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check if localStorage is available (for SSR compatibility)
  const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;
  
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState('light');
  
  // Load saved theme on initial render
  useEffect(() => {
    if (isLocalStorageAvailable) {
      const savedTheme = localStorage.getItem('surgiscan-theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Check if user prefers dark mode at OS level
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDarkMode ? 'dark' : 'light');
      }
    }
  }, [isLocalStorageAvailable]);
  
  // Update localStorage and document class when theme changes
  useEffect(() => {
    if (isLocalStorageAvailable) {
      localStorage.setItem('surgiscan-theme', theme);
      
      // Update the document class to apply the theme
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isLocalStorageAvailable]);
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};