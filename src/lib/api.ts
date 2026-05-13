// HTTP client for the Raspberry Pi local Flask backend.
// All data lives on the Pi (SQLite). Dashboard talks to it directly over HTTP.

export interface SensorData {
  ready?: boolean;
  timestamp: string;
  temperature: number;
  humidity: number;
  soil_moisture: string;
  soil_moisture_percentage: number | null;
  light_intensity: number | null;
  lux: number | null;
  ppfd: number | null;
  dli: number | null;
  is_day: boolean | null;
  devices: { irrigation: boolean; fan: boolean; grow_light: boolean };
}

export interface HistoryRow {
  ts: string;
  temperature: number | null;
  humidity: number | null;
  soil_pct: number | null;
  soil_label: string | null;
  lux: number | null;
  ppfd: number | null;
  dli: number | null;
}

export interface ConsumptionDay {
  date: string;
  power_wh: number;
  water_ml: number;
  by_device: Record<string, { on_seconds: number; wh: number }>;
}

export interface ConsumptionResponse {
  days: number;
  power_w: Record<string, number>;
  pump_flow_ml_per_s: number;
  daily: ConsumptionDay[];
}

export interface SystemConfig {
  piAddress: string;
  apiPort: string;
}

const STORAGE_KEY = 'terramonitor_config';

export const getSystemConfig = (): SystemConfig => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  return { piAddress: 'raspberrypi.local', apiPort: '5000' };
};

export const saveSystemConfig = (config: SystemConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const buildUrl = (endpoint: string): string => {
  const { piAddress, apiPort } = getSystemConfig();
  return `http://${piAddress}:${apiPort}${endpoint}`;
};

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(buildUrl(endpoint), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
};

export const fetchSensorData = () => request<SensorData>('/api/sensors');
export const fetchHistory = (hours = 24) => request<HistoryRow[]>(`/api/history?hours=${hours}`);
export const fetchConsumption = (days = 7) => request<ConsumptionResponse>(`/api/consumption?days=${days}`);
export const fetchStatus = () => request<{ status: string; uptime_s: number; devices: any }>('/api/status');

export const controlDevice = (
  device: 'irrigation' | 'fan' | 'grow_light',
  action: 'on' | 'off',
) => request<{ status: string }>(`/api/${device}/${action}`, { method: 'POST' });

export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch(buildUrl('/api/status'), { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
};
