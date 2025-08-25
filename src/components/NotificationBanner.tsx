'use client';

import { useEffect, useState } from 'react';
import { useNotifications, NotificationType } from '@/contexts/NotificationContext';

export default function NotificationBanner() {
  const { notifications, removeNotification } = useNotifications();
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'nillion-card border-nillion-primary bg-nillion-bg-secondary text-nillion-text';
      case 'error':
        return 'nillion-card border-nillion-text bg-nillion-bg-secondary text-nillion-text';
      case 'warning':
        return 'nillion-card border-nillion-text-secondary bg-nillion-bg-secondary text-nillion-text';
      case 'info':
        return 'nillion-card border-nillion-primary bg-nillion-bg-secondary text-nillion-text';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleClose = (id: string) => {
    setExitingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      removeNotification(id);
      setExitingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            ${getNotificationStyles(notification.type)}
            border shadow-lg p-3 flex items-start gap-3
            transition-all duration-300 transform
            ${exitingIds.has(notification.id) 
              ? 'opacity-0 translate-x-full' 
              : 'opacity-100 translate-x-0'
            }
          `}
        >
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">{notification.title}</h3>
            {notification.message && (
              <p className="text-xs mt-0.5 opacity-75">{notification.message}</p>
            )}
          </div>
          <button
            onClick={() => handleClose(notification.id)}
            className="flex-shrink-0 ml-2 nillion-button-ghost nillion-small"
            style={{ padding: '0.25rem' }}
            title="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}