import { create } from 'zustand';
import * as api from '../api/client';

export interface BacktestRun {
  runId: string;
  config: api.BacktestConfig;
  status: api.BacktestStatus | null;
  results: api.BacktestResults | null;
  trades: api.Trade[];
}

interface LiveState {
  status: api.LiveStatus | null;
  positions: api.Position[];
  orders: api.Order[];
  account: api.AccountBalance | null;
}

interface TradingStore {
  // Backtest state
  backtestRuns: Record<string, BacktestRun>;
  strategies: api.StrategyInfo[];
  strategiesLoading: boolean;
  instruments: api.Instrument[];
  selectedInstrument: string | null;

  // Live state
  live: LiveState;
  liveLoading: boolean;

  // Backtest actions
  runBacktest: (config: api.BacktestConfig) => Promise<string>;
  fetchBacktestStatus: (runId: string) => Promise<void>;
  fetchBacktestResults: (runId: string) => Promise<void>;
  fetchBacktestTrades: (runId: string) => Promise<void>;
  deleteBacktest: (runId: string) => void;
  cancelBacktest: (runId: string) => void;
  pollBacktestUntilComplete: (runId: string, onProgress?: (pct: number) => void) => Promise<api.BacktestResults> & { cancel: () => void };

  // Strategy actions
  fetchStrategies: () => Promise<void>;

  // Instrument actions
  fetchInstruments: () => Promise<void>;
  setSelectedInstrument: (id: string | null) => void;

  // Live actions
  fetchLiveStatus: () => Promise<void>;
  fetchLivePositions: () => Promise<void>;
  fetchLiveOrders: () => Promise<void>;
  fetchLiveAccount: () => Promise<void>;
  startLive: () => Promise<void>;
  stopLive: () => Promise<void>;
  killLive: () => Promise<void>;

  // Cleanup
  reset: () => void;
}

const initialLiveState: LiveState = {
  status: null,
  positions: [],
  orders: [],
  account: null,
};

export const useTradingStore = create<TradingStore>((set) => ({
  // Initial state
  backtestRuns: {},
  strategies: [],
  strategiesLoading: false,
  instruments: [],
  selectedInstrument: null,
  live: { ...initialLiveState },
  liveLoading: false,

  runBacktest: async (config) => {
    const response = await api.runBacktest(config);
    const run: BacktestRun = {
      runId: response.run_id,
      config,
      status: null,
      results: null,
      trades: [],
    };
    set((state) => ({
      backtestRuns: { ...state.backtestRuns, [response.run_id]: run },
    }));
    return response.run_id;
  },

  fetchBacktestStatus: async (runId) => {
    const status = await api.getBacktestStatus(runId);
    set((state) => ({
      backtestRuns: {
        ...state.backtestRuns,
        [runId]: { ...state.backtestRuns[runId]!, status },
      },
    }));
  },

  fetchBacktestResults: async (runId) => {
    const results = await api.getBacktestResults(runId);
    set((state) => ({
      backtestRuns: {
        ...state.backtestRuns,
        [runId]: { ...state.backtestRuns[runId]!, results },
      },
    }));
  },

  fetchBacktestTrades: async (runId) => {
    const trades = await api.getBacktestTrades(runId);
    set((state) => ({
      backtestRuns: {
        ...state.backtestRuns,
        [runId]: { ...state.backtestRuns[runId]!, trades },
      },
    }));
  },

  deleteBacktest: (runId) => {
    api.deleteBacktest(runId).catch(() => {});
    set((state) => {
      const { [runId]: _, ...rest } = state.backtestRuns;
      return { backtestRuns: rest };
    });
  },

  cancelBacktest: (runId) => {
    api.cancelBacktest(runId).catch(() => {});
    set((state) => {
      const existing = state.backtestRuns[runId];
      if (!existing) return state;
      return {
        backtestRuns: {
          ...state.backtestRuns,
          [runId]: {
            ...existing,
            status: {
              run_id: runId,
              status: 'cancelled' as const,
              progress: 0,
            },
          },
        },
      };
    });
  },

  pollBacktestUntilComplete: (runId, onProgress) => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cancel = () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };

    const promise = new Promise<api.BacktestResults>((resolve, reject) => {
      const poll = async () => {
        if (cancelled) {
          reject(new Error('Poll cancelled'));
          return;
        }
        try {
          const status = await api.getBacktestStatus(runId);
          set((state) => ({
            backtestRuns: {
              ...state.backtestRuns,
              [runId]: { ...state.backtestRuns[runId]!, status },
            },
          }));
 
          if (onProgress) onProgress(status.progress);
 
          if (status.status === 'completed') {
            const results = await api.getBacktestResults(runId);
            const trades = await api.getBacktestTrades(runId);
            set((state) => ({
              backtestRuns: {
                ...state.backtestRuns,
                [runId]: { ...state.backtestRuns[runId]!, results, trades },
              },
            }));
            resolve(results);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Backtest failed'));
          } else {
            timeoutId = setTimeout(poll, 1000);
          }
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });

    return Object.assign(promise, { cancel });
  },

  fetchStrategies: async () => {
    set({ strategiesLoading: true });
    try {
      const strategies = await api.getStrategies();
      set({ strategies, strategiesLoading: false });
    } catch {
      set({ strategiesLoading: false });
    }
  },

  fetchInstruments: async () => {
    try {
      const instruments = await api.getInstruments();
      set({ instruments });
    } catch {
      // Silently fail — instruments are not critical
    }
  },

  setSelectedInstrument: (id) => set({ selectedInstrument: id }),

  fetchLiveStatus: async () => {
    try {
      const status = await api.getLiveStatus();
      set((state) => ({ live: { ...state.live, status } }));
    } catch (err) { console.error(err); }
  },

  fetchLivePositions: async () => {
    try {
      const positions = await api.getLivePositions();
      set((state) => ({ live: { ...state.live, positions } }));
    } catch (err) { console.error(err); }
  },

  fetchLiveOrders: async () => {
    try {
      const orders = await api.getLiveOrders();
      set((state) => ({ live: { ...state.live, orders } }));
    } catch (err) { console.error(err); }
  },

  fetchLiveAccount: async () => {
    try {
      const account = await api.getLiveAccount();
      set((state) => ({ live: { ...state.live, account } }));
    } catch (err) { console.error(err); }
  },

  startLive: async () => {
    try {
      const status = await api.startLive();
      set((state) => ({ live: { ...state.live, status } }));
    } catch (err) { console.error(err); }
  },

  stopLive: async () => {
    try {
      const status = await api.stopLive();
      set((state) => ({ live: { ...state.live, status } }));
    } catch (err) { console.error(err); }
  },

  killLive: async () => {
    try {
      const status = await api.killLive();
      set((state) => ({ live: { ...state.live, status } }));
      set((state) => ({
        live: { ...state.live, positions: [], orders: [] },
      }));
    } catch (err) { console.error(err); }
  },

  reset: () =>
    set({
      backtestRuns: {},
      strategies: [],
      strategiesLoading: false,
      instruments: [],
      selectedInstrument: null,
      live: { ...initialLiveState },
      liveLoading: false,
    }),
}));

const STORE_KEY = 'nt-store';
const MAX_STORE_SIZE = 4_000_000; // ~4MB limit (safety margin under 5MB quota)

// Hydrate from localStorage on load
try {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object' && 'backtestRuns' in parsed) {
      useTradingStore.setState(parsed);
    }
  }
} catch (err) {
  console.warn('Failed to restore store from localStorage:', err);
}

// Persist to localStorage on every change (with size check)
useTradingStore.subscribe((state) => {
  try {
    const serialized = JSON.stringify(state);
    if (serialized.length > MAX_STORE_SIZE) {
      console.warn(
        `Store size ${(serialized.length / 1024 / 1024).toFixed(1)}MB exceeds safe limit. ` +
        'Not persisting to localStorage.'
      );
      return;
    }
    localStorage.setItem(STORE_KEY, serialized);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Store not persisted.');
    } else {
      console.warn('Failed to persist store:', err);
    }
  }
});

export default useTradingStore;
