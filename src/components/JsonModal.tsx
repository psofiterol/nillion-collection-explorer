'use client';

import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface JsonModalProps {
  title: string;
  subtitle?: string;
  data: any;
  isOpen: boolean;
  onClose: () => void;
  link?: {
    text: string;
    href: string;
  };
}

export default function JsonModal({ title, subtitle, data, isOpen, onClose, link }: JsonModalProps) {
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="nillion-card max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="border-b border-nillion-border pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-nillion-text-secondary">
                  {subtitle}
                </p>
              )}
              {link && (
                <p className="text-sm mt-1">
                  <a 
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-nillion-primary hover:text-nillion-primary-dark underline"
                  >
                    {link.text}
                  </a>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={handleCopy}
                className={`nillion-small ${
                  copied 
                    ? '' 
                    : 'nillion-button-outline'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy JSON'}
              </button>
              <button
                onClick={onClose}
                className="nillion-button-ghost nillion-small"
                style={{ padding: '0.25rem' }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <pre className="p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>

      </div>
    </div>
  );
}