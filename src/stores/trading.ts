import { create } from 'zustand';
import * as api from '../api/client';

interface BacktestRun {
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
  pollBacktestUntilComplete: (runId: string, onProgress?: (pct: number) => void) => Promise<api.BacktestResults>;

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
        [runId]: { ...state.backtestRuns[runId], status },
      },
    }));
  },

  fetchBacktestResults: async (runId) => {
    const results = await api.getBacktestResults(runId);
    set((state) => ({
      backtestRuns: {
        ...state.backtestRuns,
        [runId]: { ...state.backtestRuns[runId], results },
      },
    }));
  },

  fetchBacktestTrades: async (runId) => {
    const trades = await api.getBacktestTrades(runId);
    set((state) => ({
      backtestRuns: {
        ...state.backtestRuns,
        [runId]: { ...state.backtestRuns[runId], trades },
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

  pollBacktestUntilComplete: async (runId, onProgress) => {
    return new Promise<api.BacktestResults>((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await api.getBacktestStatus(runId);
          set((state) => ({
            backtestRuns: {
              ...state.backtestRuns,
              [runId]: { ...state.backtestRuns[runId], status },
            },
}) as TradingStore);

          if (onProgress) onProgress(status.progress);

          if (status.status === 'completed') {
            const results = await api.getBacktestResults(runId);
            const trades = await api.getBacktestTrades(runId);
            set((state) => ({
              backtestRuns: {
                ...state.backtestRuns,
                [runId]: { ...state.backtestRuns[runId], results, trades },
              },
}));
            resolve(results);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Backtest failed'));
          } else {
            setTimeout(poll, 1000);
          }
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });
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

// Hydrate from localStorage on load
const saved = localStorage.getItem('nt-store');
if (saved) {
  try { useTradingStore.setState(JSON.parse(saved)); } catch {}
}

// Persist to localStorage on every change
useTradingStore.subscribe((state) => {
  try { localStorage.setItem('nt-store', JSON.stringify(state)); } catch {}
});

export default useTradingStore;
