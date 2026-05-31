import { useEffect, useState, useCallback } from 'react';
import { fetchSensorData } from '@/lib/api';


export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: string;
  lightIntensity: number | null;
  lux: number | null;
  ppfd: number | null;
  dli: number | null;
  isDay: boolean | null;
  timestamp: string;
  lastIrrigationAt: string | null;
  devices: { irrigation: boolean; fan: boolean; grow_light: boolean; door: boolean; };
}

const initial: SensorData = {
  temperature: 0,
  humidity: 0,
  soilMoisture: 'Unknown',
  lightIntensity: null,
  lux: null,
  ppfd: null,
  dli: null,
  isDay: null,
  timestamp: new Date().toISOString(),
  lastIrrigationAt: null,
  devices: { irrigation: false, fan: false, grow_light: false, door:false },
};

export function useSensorData(pollMs = 5000) {
  const [sensorData, setSensorData] = useState<SensorData>(initial);
  const [isConnected, setIsConnected] = useState(false);

  // 1. We create the refresh function OUTSIDE the useEffect so we can export it
  const refresh = useCallback(async () => {
    try {
      const d = await fetchSensorData();
      if (d.ready === false) {
        setIsConnected(true);
        setSensorData((prev) => ({ 
          ...prev, 
          devices: { ...prev.devices, ...(d.devices || {}) } 
        }));
        return;
      }
      setSensorData({
        temperature: d.temperature ?? 0,
        humidity: d.humidity ?? 0,
        soilMoisture: d.soil_moisture ?? 'Unknown',
        lightIntensity: d.light_intensity,
        lux: d.lux,
        ppfd: d.ppfd,
        dli: d.dli,
        isDay: d.is_day,
        timestamp: d.timestamp,
        lastIrrigationAt: (d as any).last_irrigation ?? null,
        devices: { ...initial.devices, ...(d.devices || {}) },
      });
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, []);

  // 2. The useEffect now just calls our refresh function on a timer
  useEffect(() => {
    refresh(); // Fetch immediately on load
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [pollMs, refresh]);

  // 3. Now we can successfully return it!
  return { sensorData, isConnected, refresh };
}