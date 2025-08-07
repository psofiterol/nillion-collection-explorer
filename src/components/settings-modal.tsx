'use client';

import {
  useNetworkConfig,
  NetworkConfigType,
  PresetType,
  PRESET_CONFIGS,
} from '@/providers/network-config-provider';
import { useState, useEffect } from 'react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightApiKey?: boolean;
}

export function SettingsModal({
  open,
  onOpenChange,
  highlightApiKey = false,
}: SettingsModalProps) {
  const { currentConfig, currentPreset, setNetworkConfig } = useNetworkConfig();
  const [selectedPreset, setSelectedPreset] =
    useState<PresetType>(currentPreset);
  const [formValues, setFormValues] = useState({
    NILCHAIN_URL: '',
    NILAUTH_URL: '',
    NILDB_NODES: ['', '', ''],
    NILLION_API_KEY: '',
  });

  useEffect(() => {
    if (open) {
      setSelectedPreset(currentPreset);
      setFormValues({
        NILCHAIN_URL: currentConfig.NILCHAIN_URL,
        NILAUTH_URL: currentConfig.NILAUTH_URL,
        NILDB_NODES: [...currentConfig.NILDB_NODES],
        NILLION_API_KEY: currentConfig.NILLION_API_KEY || '',
      });
    }
  }, [open, currentConfig, currentPreset]);

  const handleSave = () => {
    setNetworkConfig(formValues as unknown as NetworkConfigType, selectedPreset);
    onOpenChange(false);
  };

  const handlePresetChange = (preset: PresetType) => {
    setSelectedPreset(preset);

    if (preset !== 'custom') {
      // Load preset values but keep the current API key
      const presetConfig = PRESET_CONFIGS[preset];
      setFormValues({
        NILCHAIN_URL: presetConfig.NILCHAIN_URL,
        NILAUTH_URL: presetConfig.NILAUTH_URL,
        NILDB_NODES: [...presetConfig.NILDB_NODES],
        NILLION_API_KEY: formValues.NILLION_API_KEY,
      });
    }
  };

  const handleInputChange = (field: keyof NetworkConfigType, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Switch to custom when user edits network values (but not API key)
    if (selectedPreset !== 'custom' && field !== 'NILLION_API_KEY') {
      setSelectedPreset('custom');
    }
  };

  const handleNodeChange = (index: number, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      NILDB_NODES: prev.NILDB_NODES.map((node, i) =>
        i === index ? value : node
      ),
    }));

    // Switch to custom when user edits values
    if (selectedPreset !== 'custom') {
      setSelectedPreset('custom');
    }
  };

  const hasChanges =
    JSON.stringify(formValues) !== JSON.stringify(currentConfig) ||
    selectedPreset !== currentPreset;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-light tracking-wide text-gray-900 dark:text-gray-100 mb-5">
            Network Configuration
          </h2>

          {/* Preset Selection */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium tracking-wide text-gray-700 dark:text-gray-300 uppercase">
                Network Preset
              </label>
              <a
                href="https://docs.nillion.com/build/network-config#nildb-nodes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors inline-flex items-center gap-1"
              >
                [see Nillion docs
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                ]
              </a>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange('testnet')}
                className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  selectedPreset === 'testnet'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100'
                }`}
              >
                Testnet
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('mainnet')}
                className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  selectedPreset === 'mainnet'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100'
                }`}
              >
                Mainnet
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('custom')}
                className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  selectedPreset === 'custom'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-100'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium tracking-wide text-gray-700 dark:text-gray-300 mb-1 uppercase">
                Nilchain URL
              </label>
              <input
                type="text"
                value={formValues.NILCHAIN_URL}
                onChange={(e) =>
                  handleInputChange('NILCHAIN_URL', e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wide text-gray-700 dark:text-gray-300 mb-1 uppercase">
                Nilauth URL
              </label>
              <input
                type="text"
                value={formValues.NILAUTH_URL}
                onChange={(e) =>
                  handleInputChange('NILAUTH_URL', e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wide text-gray-700 dark:text-gray-300 mb-1 uppercase">
                NilDB Nodes
              </label>
              <div className="space-y-2">
                {formValues.NILDB_NODES.map((node, index) => (
                  <input
                    key={index}
                    type="text"
                    value={node}
                    onChange={(e) => handleNodeChange(index, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 dark:bg-gray-700 dark:text-white transition-colors font-mono"
                    placeholder={`Node ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <label
                  className={`text-xs font-medium tracking-wide uppercase ${
                    highlightApiKey
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  API Key
                  {highlightApiKey && (
                    <span className="text-red-600 dark:text-red-400 ml-1">
                      *
                    </span>
                  )}
                </label>
                <a
                  href="https://docs.nillion.com/build/network-api-access"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors inline-flex items-center gap-1"
                >
                  [see Nillion docs
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  ]
                </a>
              </div>
              <input
                type="password"
                value={formValues.NILLION_API_KEY || ''}
                onChange={(e) =>
                  handleInputChange('NILLION_API_KEY', e.target.value)
                }
                className={`w-full px-3 py-2 text-sm border focus:outline-none dark:bg-gray-700 dark:text-white transition-colors font-mono ${
                  highlightApiKey
                    ? 'border-red-500 dark:border-red-500 focus:border-red-600 dark:focus:border-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-gray-100'
                }`}
                placeholder="Your API key"
                autoFocus={highlightApiKey}
              />
              {highlightApiKey && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  A valid Nillion API key is required
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Stored in localStorage for development only
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {selectedPreset}
            </span>
            <div className="flex space-x-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {hasChanges && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Page will reload to apply changes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
