import { create } from 'zustand';

interface ApiCallStat {
  endpoint: string;
  method: string;
  status_code: number;
  processing_time_ms: number;
  created_at: string;
}

interface UsageStats {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  callsToday: number;
  callsThisMonth: number;
  endpointBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  dailyUsage: { date: string; count: number }[];
}

interface ApiUsageState {
  calls: ApiCallStat[];
  stats: UsageStats;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCalls: (calls: ApiCallStat[]) => void;
  addCall: (call: ApiCallStat) => void;
  setStats: (stats: UsageStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  calculateStats: () => void;
  reset: () => void;
}

const initialStats: UsageStats = {
  totalCalls: 0,
  successRate: 0,
  avgLatency: 0,
  callsToday: 0,
  callsThisMonth: 0,
  endpointBreakdown: {},
  statusBreakdown: {},
  dailyUsage: [],
};

export const useApiUsageStore = create<ApiUsageState>((set, get) => ({
  calls: [],
  stats: initialStats,
  isLoading: false,
  error: null,

  setCalls: (calls) => {
    set({ calls });
    get().calculateStats();
  },

  addCall: (call) => {
    set((state) => ({ calls: [call, ...state.calls].slice(0, 1000) }));
    get().calculateStats();
  },

  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  calculateStats: () => {
    const { calls } = get();
    if (calls.length === 0) {
      set({ stats: initialStats });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const successCalls = calls.filter((c) => c.status_code >= 200 && c.status_code < 300);
    const totalLatency = calls.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0);

    // Endpoint breakdown
    const endpointBreakdown: Record<string, number> = {};
    calls.forEach((c) => {
      endpointBreakdown[c.endpoint] = (endpointBreakdown[c.endpoint] || 0) + 1;
    });

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    calls.forEach((c) => {
      const statusGroup = `${Math.floor(c.status_code / 100)}xx`;
      statusBreakdown[statusGroup] = (statusBreakdown[statusGroup] || 0) + 1;
    });

    // Daily usage for last 30 days
    const dailyMap: Record<string, number> = {};
    calls.forEach((c) => {
      const date = new Date(c.created_at).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });
    const dailyUsage = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Today and month counts
    const callsToday = calls.filter((c) => new Date(c.created_at) >= todayStart).length;
    const callsThisMonth = calls.filter((c) => new Date(c.created_at) >= monthStart).length;

    set({
      stats: {
        totalCalls: calls.length,
        successRate: (successCalls.length / calls.length) * 100,
        avgLatency: totalLatency / calls.length,
        callsToday,
        callsThisMonth,
        endpointBreakdown,
        statusBreakdown,
        dailyUsage,
      },
    });
  },

  reset: () => set({ calls: [], stats: initialStats, isLoading: false, error: null }),
}));
