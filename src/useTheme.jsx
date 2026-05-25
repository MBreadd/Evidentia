import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Cargar del localStorage o usar light como default
    const saved = localStorage.getItem('theme-preference');
    if (saved) {
      return saved === 'dark';
    }
    return false; // default: light mode
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
    // Actualizar el HTML tag para Tailwind
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    bg: {
      primary: isDark ? 'bg-[#0a0a0a]' : 'bg-white',
      secondary: isDark ? 'bg-gray-900/50' : 'bg-gray-50',
      tertiary: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
      card: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    },
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
      muted: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-white/10' : 'border-gray-200',
      secondary: isDark ? 'border-white/5' : 'border-gray-100',
      hover: isDark ? 'hover:border-white/20' : 'hover:border-gray-300',
    },
    input: {
      bg: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
      border: isDark ? 'border-white/10' : 'border-gray-300',
      text: isDark ? 'text-white' : 'text-gray-900',
      placeholder: isDark ? 'placeholder-gray-500' : 'placeholder-gray-400',
    },
    button: {
      primary: isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700',
      secondary: isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300',
    },
    shadow: isDark ? 'shadow-lg' : 'shadow-md',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
