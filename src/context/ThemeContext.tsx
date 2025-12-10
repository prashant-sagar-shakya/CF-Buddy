import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string; // Kept for compatibility but ignored
  storageKey?: string; // Kept for compatibility but ignored
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always dark
  const theme: Theme = "dark";

  // Apply theme changes to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    // No-op
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
