// API utilities for connecting to Raspberry Pi Flask backend

export interface SensorData {
  temperature: number;
  humidity: number;
  light_intensity: number | null;
  soil_moisture: string;
  timestamp: string;
}

export interface SystemConfig {
  piAddress: string;
  apiPort: string;
}

// Get saved configuration from localStorage
export const getSystemConfig = (): SystemConfig | null => {
  const config = localStorage.getItem('terramonitor_config');
  return config ? JSON.parse(config) : null;
};

// Save configuration to localStorage
export const saveSystemConfig = (config: SystemConfig): void => {
  localStorage.setItem('terramonitor_config', JSON.stringify(config));
};

// Build API URL
const buildApiUrl = (endpoint: string): string => {
  const config = getSystemConfig();
  if (!config) {
    throw new Error('System not configured. Please set your Raspberry Pi IP address.');
  }
  return `http://${config.piAddress}:${config.apiPort}${endpoint}`;
};

// Fetch sensor data from Raspberry Pi
export const fetchSensorData = async (): Promise<SensorData> => {
  try {
    const response = await fetch(buildApiUrl('/api/sensors'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
};

// Control irrigation system
export const controlIrrigation = async (action: 'on' | 'off'): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(buildApiUrl(`/api/irrigation/${action}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error controlling irrigation:', error);
    throw error;
  }
};

// Control fan system
export const controlFan = async (action: 'on' | 'off'): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(buildApiUrl(`/api/fan/${action}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error controlling fan:', error);
    throw error;
  }
};

// Test connection to Raspberry Pi
export const testConnection = async (): Promise<boolean> => {
  try {
    const config = getSystemConfig();
    if (!config) return false;

    const response = await fetch(buildApiUrl('/api/status'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};
