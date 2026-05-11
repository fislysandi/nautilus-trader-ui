/// <reference types="vite/client" />

const BASE_URL = '/api';

export interface BacktestConfig {
  strategy_name: string;
  instrument_id: string;
  start_date: string;
  end_date: string;
  initial_capital?: string;
  params?: Record<string, unknown>;
}

export interface BacktestRunResponse {
  run_id: string;
}

export interface BacktestStatus {
  run_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string | null;
  logs?: string[];
}

export interface BacktestMetrics {
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  total_pnl?: number | null;
  win_rate?: number | null;
  profit_factor?: number | null;
  max_drawdown?: number | null;
  total_trades: number;
}

export interface BacktestResults {
  run_id: string;
  status: string;
  metrics: BacktestMetrics;
  equity_curve: Array<{ timestamp: string; value: number }>;
  drawdown_curve: Array<{ timestamp: string; value: number }>;
}

export interface Trade {
  entry_time: string;
  exit_time?: string | null;
  side: string;
  size: number;
  entry_price: number;
  exit_price?: number | null;
  pnl?: number | null;
  instrument_id: string;
}

export interface Position {
  instrument_id: string;
  side: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
}

export interface Order {
  instrument_id: string;
  side: string;
  order_type: string;
  price: number;
  quantity: number;
  status: string;
}

export interface StrategyInfo {
  name: string;
  description: string;
  file_path: string;
  backtest_count: number;
}

export interface StrategyParam {
  name: string;
  type: string;
  default: unknown;
  description: string;
}

export interface LiveStatus {
  status: 'running' | 'stopped' | 'error';
  uptime_seconds: number;
  node_version: string;
  active_strategies: number;
}

export interface AccountBalance {
  total_balance: number;
  available_balance: number;
  in_use: number;
  margin_usage_pct: number;
}

export interface Instrument {
  id: string;
  venue: string;
  tick_size: number;
  lot_size: number;
  currency: string;
}

export interface SweepConfig {
  strategy_name: string;
  instrument_id: string;
  start_date: string;
  end_date: string;
  initial_capital?: string;
  param_name: string;
  param_values: number[];
  fixed_params?: Record<string, number | string>;
}

export interface SweepResult {
  param_value: unknown;
  metrics: BacktestMetrics;
}

export interface SweepResponse {
  sweep_id: string;
  status: string;
  results: SweepResult[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body.detail) detail = body.detail;
    } catch {}
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function runBacktest(config: BacktestConfig): Promise<BacktestRunResponse> {
  return request<BacktestRunResponse>('/backtest/run', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function getBacktestStatus(runId: string, since = 0): Promise<BacktestStatus> {
  const params = since > 0 ? `?since=${since}` : '';
  return request<BacktestStatus>(`/backtest/${runId}/status${params}`);
}

export async function getBacktestResults(runId: string): Promise<BacktestResults> {
  return request<BacktestResults>(`/backtest/${runId}/results`);
}

export async function getBacktestTrades(runId: string): Promise<Trade[]> {
  return request<Trade[]>(`/backtest/${runId}/trades`);
}

export async function getBacktestPositions(runId: string): Promise<Position[]> {
  return request<Position[]>(`/backtest/${runId}/positions`);
}

export async function getBacktestFills(runId: string): Promise<Record<string, unknown>[]> {
  return request<Record<string, unknown>[]>(`/backtest/${runId}/fills`);
}

export async function deleteBacktest(runId: string): Promise<void> {
  return request<void>(`/backtest/${runId}`, { method: 'DELETE' });
}

export async function runSweep(config: SweepConfig): Promise<{ sweep_id: string }> {
  return request<{ sweep_id: string }>('/backtest/sweep', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function getSweepResults(sweepId: string): Promise<SweepResponse> {
  return request<SweepResponse>(`/backtest/sweep/${sweepId}`);
}

export async function getStrategies(): Promise<StrategyInfo[]> {
  return request<StrategyInfo[]>('/strategies');
}

export async function getStrategyDetail(name: string): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/strategies/${encodeURIComponent(name)}`);
}

export async function getStrategyParams(name: string): Promise<StrategyParam[]> {
  return request<StrategyParam[]>(`/strategies/${encodeURIComponent(name)}/params`);
}

export async function getStrategySource(name: string): Promise<{ name: string; source: string; lines: number }> {
  return request<{ name: string; source: string; lines: number }>(`/strategies/${encodeURIComponent(name)}/source`);
}

export async function importStrategy(file: File): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BASE_URL}/strategies/import`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new ApiError(response.status, (await response.json()).detail || 'Import failed');
  return response.json();
}

export async function updateStrategySource(name: string, source: string): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/strategies/${encodeURIComponent(name)}/source`, {
    method: 'PUT',
    body: JSON.stringify({ source }),
  });
}

export async function getLiveStatus(): Promise<LiveStatus> {
  return request<LiveStatus>('/live/status');
}

export async function startLive(): Promise<LiveStatus> {
  return request<LiveStatus>('/live/start', { method: 'POST' });
}

export async function stopLive(): Promise<LiveStatus> {
  return request<LiveStatus>('/live/stop', { method: 'POST' });
}

export async function killLive(): Promise<LiveStatus> {
  return request<LiveStatus>('/live/kill', { method: 'POST' });
}

export async function getLivePositions(): Promise<Position[]> {
  return request<Position[]>('/live/positions');
}

export async function getLiveOrders(): Promise<Order[]> {
  return request<Order[]>('/live/orders');
}

export async function getLiveAccount(): Promise<AccountBalance> {
  return request<AccountBalance>('/live/account');
}

export async function getInstruments(): Promise<Instrument[]> {
  return request<Instrument[]>('/instruments');
}

export async function getInstrument(id: string): Promise<Instrument> {
  return request<Instrument>(`/instruments/${encodeURIComponent(id)}`);
}
