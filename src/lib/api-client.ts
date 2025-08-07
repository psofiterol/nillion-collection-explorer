import { getCurrentNetworkConfig } from '@/providers/network-config-provider';

interface FetchOptions extends RequestInit {
  includeConfig?: boolean;
}

export async function apiFetch(url: string, options: FetchOptions = {}) {
  const { includeConfig = true, ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers);
  
  // Include network config in headers if requested
  if (includeConfig) {
    const config = getCurrentNetworkConfig();
    headers.set('x-nillion-config', JSON.stringify(config));
  }
  
  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}