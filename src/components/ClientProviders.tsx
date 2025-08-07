'use client';

import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationBanner from '@/components/NotificationBanner';
import { NetworkConfigProvider } from '@/providers/network-config-provider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <NetworkConfigProvider>
      <NotificationProvider>
        <NotificationBanner />
        {children}
      </NotificationProvider>
    </NetworkConfigProvider>
  );
}