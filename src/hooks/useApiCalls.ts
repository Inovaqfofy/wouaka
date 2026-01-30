import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApiCall {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  processing_time_ms: number | null;
  created_at: string;
  request_body: any;
  response_body: any;
}

export interface ApiStats {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  callsToday: number;
}

export function useApiCalls() {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [stats, setStats] = useState<ApiStats>({
    totalCalls: 0,
    successRate: 0,
    avgLatency: 0,
    callsToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchApiCalls = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('api_calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiCalls(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const successfulCalls = data.filter(c => c.status_code >= 200 && c.status_code < 300);
        const latencies = data.filter(c => c.processing_time_ms).map(c => c.processing_time_ms!);
        const today = new Date().toDateString();
        const callsToday = data.filter(c => new Date(c.created_at).toDateString() === today);

        setStats({
          totalCalls: data.length,
          successRate: data.length > 0 ? (successfulCalls.length / data.length) * 100 : 0,
          avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
          callsToday: callsToday.length,
        });
      }
    } catch (error) {
      console.error('Error fetching API calls:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiCalls();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('api_calls_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_calls',
        },
        () => {
          fetchApiCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApiCalls]);

  return {
    apiCalls,
    stats,
    isLoading,
    fetchApiCalls,
  };
}
