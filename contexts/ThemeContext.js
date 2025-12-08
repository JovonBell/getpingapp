import React, { createContext, useState, useContext } from 'react';

const THEMES = {
  default: {
    id: 'default',
    name: 'Cosmic Green',
    primary: '#4FFFB0',
    primaryGlow: 'rgba(79, 255, 176, 0.4)',
    primaryLight: 'rgba(79, 255, 176, 0.1)',
  },
  blue: {
    id: 'blue',
    name: 'Electric Blue',
    primary: '#4F9FFF',
    primaryGlow: 'rgba(79, 159, 255, 0.4)',
    primaryLight: 'rgba(79, 159, 255, 0.1)',
  },
  purple: {
    id: 'purple',
    name: 'Nebula Purple',
    primary: '#B04FFF',
    primaryGlow: 'rgba(176, 79, 255, 0.4)',
    primaryLight: 'rgba(176, 79, 255, 0.1)',
  },
  pink: {
    id: 'pink',
    name: 'Rose Pink',
    primary: '#FF4F9F',
    primaryGlow: 'rgba(255, 79, 159, 0.4)',
    primaryLight: 'rgba(255, 79, 159, 0.1)',
  },
  orange: {
    id: 'orange',
    name: 'Solar Orange',
    primary: '#FF9F4F',
    primaryGlow: 'rgba(255, 159, 79, 0.4)',
    primaryLight: 'rgba(255, 159, 79, 0.1)',
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  const theme = THEMES[currentTheme];

  const changeTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
