'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNetworkConfig } from '@/providers/network-config-provider';

export function useConfigValidation() {
  const { currentConfig } = useNetworkConfig();
  const pathname = usePathname();
  const [shouldShowSettings, setShouldShowSettings] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Wait a bit for the config to load from localStorage
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Don't run validation until config is initialized
    if (!isInitialized) return;

    // Only validate on non-home pages
    if (pathname !== '/') {
      const hasApiKey = currentConfig.NILLION_API_KEY && currentConfig.NILLION_API_KEY.trim() !== '';
      
      if (!hasApiKey && !hasBeenDismissed) {
        setShouldShowSettings(true);
      } else if (hasApiKey) {
        // Reset dismissal state when API key is present
        setHasBeenDismissed(false);
        setShouldShowSettings(false);
      }
    } else {
      // Reset state when on home page
      setShouldShowSettings(false);
      setHasBeenDismissed(false);
    }
  }, [pathname, currentConfig.NILLION_API_KEY, hasBeenDismissed, isInitialized]);

  const dismissSettings = () => {
    setShouldShowSettings(false);
    setHasBeenDismissed(true);
  };

  return {
    shouldShowSettings,
    dismissSettings,
    isApiKeyMissing: !currentConfig.NILLION_API_KEY || currentConfig.NILLION_API_KEY.trim() === '',
  };
}