'use client';

import { SettingsModal } from '@/components/settings-modal';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { useConfigValidation } from '@/hooks/use-config-validation';

export function NavbarClient() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { shouldShowSettings, dismissSettings, isApiKeyMissing } = useConfigValidation();

  // Auto-open settings when API key is missing on non-home pages
  useEffect(() => {
    if (shouldShowSettings) {
      setSettingsOpen(true);
    }
  }, [shouldShowSettings]);

  const handleSettingsClose = (open: boolean) => {
    setSettingsOpen(open);
    if (!open) {
      dismissSettings();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => setSettingsOpen(true)}
          className="nillion-button-secondary nillion-small"
          aria-label="Settings"
          title="Network settings"
        >
          ⚙️
        </button>
      </div>
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={handleSettingsClose}
        highlightApiKey={isApiKeyMissing}
      />
    </>
  );
}