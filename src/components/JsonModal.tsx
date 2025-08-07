'use client';

import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface JsonModalProps {
  title: string;
  subtitle?: string;
  data: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function JsonModal({ title, subtitle, data, isOpen, onClose }: JsonModalProps) {
  const { addNotification } = useNotifications();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      addNotification({
        type: 'success',
        title: 'Copied to clipboard',
        message: 'JSON has been copied to your clipboard',
        duration: 3000,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Copy failed',
        message: 'Failed to copy to clipboard',
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-4"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
                    {subtitle}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <button
                onClick={handleCopy}
                className={`px-4 py-2 text-sm rounded-none transition-all duration-300 font-medium tracking-wide ${
                  copied 
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                    : 'border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900'
                }`}
              >
                {copied ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy JSON
                  </span>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors duration-300"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>

      </div>
    </div>
  );
}