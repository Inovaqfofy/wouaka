/**
 * WOUAKA SDK React Hook
 * Provides a typed SDK client with automatic API key management
 * 
 * @example
 * ```tsx
 * const { client, isReady, error } = useWouakaSdk();
 * 
 * if (isReady && client) {
 *   const score = await client.scores.calculate({ ... });
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { WouakaClient } from '@wouaka/sdk';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  getWouakaClient, 
  clearWouakaClient, 
  parseWouakaSdkError,
  type WouakaSdkError 
} from '@/lib/wouaka-sdk-client';

interface UseWouakaSdkResult {
  /** The initialized SDK client */
  client: WouakaClient | null;
  /** Whether the SDK is ready to use */
  isReady: boolean;
  /** Whether the SDK is currently loading */
  isLoading: boolean;
  /** Any error that occurred during initialization */
  error: WouakaSdkError | null;
  /** The current API key being used */
  apiKey: string | null;
  /** Refresh the API key and reinitialize the client */
  refresh: () => Promise<void>;
}

interface UseWouakaSdkOptions {
  /** Use a specific API key instead of auto-fetching */
  apiKey?: string;
  /** Skip initialization (useful for conditional loading) */
  skip?: boolean;
}

/**
 * Hook to get an initialized WOUAKA SDK client
 */
export function useWouakaSdk(options: UseWouakaSdkOptions = {}): UseWouakaSdkResult {
  const { user } = useAuth();
  const [client, setClient] = useState<WouakaClient | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(options.apiKey || null);
  const [isLoading, setIsLoading] = useState(!options.skip);
  const [error, setError] = useState<WouakaSdkError | null>(null);

  // Fetch the user's active API key from Supabase
  const fetchApiKey = useCallback(async (): Promise<string | null> => {
    if (options.apiKey) {
      return options.apiKey;
    }

    if (!user?.id) {
      return null;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('key_prefix, id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !data) {
        console.warn('No active API key found for user');
        return null;
      }

      // Note: We only store key_prefix in DB, the full key was shown once at creation
      // For internal SDK calls, we'll use a service key pattern
      // In production, this would use a different auth mechanism
      const serviceKey = `wk_${import.meta.env.DEV ? 'test' : 'live'}_internal_${data.id.slice(0, 8)}`;
      return serviceKey;
    } catch (err) {
      console.error('Failed to fetch API key:', err);
      return null;
    }
  }, [user?.id, options.apiKey]);

  // Initialize the SDK client
  const initializeClient = useCallback(async () => {
    if (options.skip) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const key = await fetchApiKey();
      
      if (!key) {
        // Use a demo/anonymous key for public pages
        const demoKey = `wk_${import.meta.env.DEV ? 'test' : 'live'}_demo`;
        const demoClient = getWouakaClient(demoKey);
        setClient(demoClient);
        setApiKey(demoKey);
        setIsLoading(false);
        return;
      }

      const sdkClient = getWouakaClient(key);
      setClient(sdkClient);
      setApiKey(key);
    } catch (err) {
      const parsedError = parseWouakaSdkError(err);
      setError(parsedError);
      console.error('Failed to initialize WOUAKA SDK:', parsedError);
    } finally {
      setIsLoading(false);
    }
  }, [fetchApiKey, options.skip]);

  // Initialize on mount and when user changes
  useEffect(() => {
    initializeClient();

    return () => {
      // Cleanup on unmount if needed
    };
  }, [initializeClient]);

  // Clear client on user logout
  useEffect(() => {
    if (!user) {
      clearWouakaClient();
      setClient(null);
      setApiKey(null);
    }
  }, [user]);

  const isReady = useMemo(() => !isLoading && client !== null && error === null, [isLoading, client, error]);

  return {
    client,
    isReady,
    isLoading,
    error,
    apiKey,
    refresh: initializeClient,
  };
}

export default useWouakaSdk;
