import { useEffect, useState } from 'react';
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
  devices: { irrigation: boolean; fan: boolean; grow_light: boolean };
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
  devices: { irrigation: false, fan: false, grow_light: false },
};

export function useSensorData(pollMs = 5000) {
  const [sensorData, setSensorData] = useState<SensorData>(initial);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const d = await fetchSensorData();
        if (cancelled) return;
        if (d.ready === false) {
          setIsConnected(true);
          setSensorData((prev) => ({ ...prev, devices: d.devices ?? prev.devices }));
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
          devices: d.devices ?? initial.devices,
        });
        setIsConnected(true);
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    };

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { sensorData, isConnected };
}
