'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const isDarkMode = savedTheme === 'dark';
      setIsDark(isDarkMode);
      // Ensure proper classes are set
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(isDarkMode ? 'dark' : 'light');
    } else {
      // No saved preference, use system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      // Ensure proper classes are set
      document.body.classList.remove('dark', 'light');
      document.body.classList.add(prefersDark ? 'dark' : 'light');
      
      // Also listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Only update if user hasn't set a manual preference
        if (!localStorage.getItem('theme')) {
          setIsDark(e.matches);
          document.body.classList.remove('dark', 'light');
          document.body.classList.add(e.matches ? 'dark' : 'light');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    // Remove existing class and add new one to ensure proper toggle
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newIsDark ? 'dark' : 'light');
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="nillion-button-secondary nillion-small"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}