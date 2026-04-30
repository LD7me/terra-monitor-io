import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: string;
  soilMoisturePercentage: number | null;
  lightIntensity: number | null;
  lux: number | null;
  ppfd: number | null;
  dli: number | null;
  isDay: boolean | null;
  timestamp: string;
  batteryPercentage: number | null;
  batteryVoltage: number | null;
  wifiSignalStrength: number | null;
}

const initialData: SensorData = {
  temperature: 0,
  humidity: 0,
  soilMoisture: 'Unknown',
  soilMoisturePercentage: null,
  lightIntensity: null,
  lux: null,
  ppfd: null,
  dli: null,
  isDay: null,
  timestamp: new Date().toISOString(),
  batteryPercentage: null,
  batteryVoltage: null,
  wifiSignalStrength: null,
};

const mapRow = (row: any): SensorData => ({
  temperature: row.temperature,
  humidity: row.humidity,
  soilMoisture: row.soil_moisture,
  soilMoisturePercentage: row.soil_moisture_percentage,
  lightIntensity: row.light_intensity ?? null,
  lux: row.lux ?? null,
  ppfd: row.ppfd ?? null,
  dli: row.dli ?? null,
  isDay: row.is_day ?? null,
  timestamp: row.timestamp,
  batteryPercentage: row.battery_percentage,
  batteryVoltage: row.battery_voltage,
  wifiSignalStrength: row.wifi_signal_strength,
});

export function useSensorData() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchLatestReading = async () => {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const newData = mapRow(data);
        setSensorData(newData);

        const lastUpdate = new Date(data.timestamp).getTime();
        setIsConnected(Date.now() - lastUpdate < 30000);

        checkAlertsAndIrrigation(newData);
      }
    };

    fetchLatestReading();

    const channel = supabase
      .channel('sensor_readings_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const formattedData = mapRow(payload.new);
          setSensorData(formattedData);
          setIsConnected(true);
          checkAlertsAndIrrigation(formattedData);
        }
      )
      .subscribe();

    const interval = setInterval(fetchLatestReading, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const checkAlertsAndIrrigation = async (data: SensorData) => {
    if (!user) return;

    const { data: config } = await supabase
      .from('alert_configurations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!config) return;

    if (config.email_alerts && config.email_address) {
      const alerts: { type: string; value: number; threshold: number }[] = [];

      if (data.temperature < config.temp_min) alerts.push({ type: 'Temperature Too Low', value: data.temperature, threshold: config.temp_min });
      if (data.temperature > config.temp_max) alerts.push({ type: 'Temperature Too High', value: data.temperature, threshold: config.temp_max });
      if (data.humidity < config.humidity_min) alerts.push({ type: 'Humidity Too Low', value: data.humidity, threshold: config.humidity_min });
      if (data.humidity > config.humidity_max) alerts.push({ type: 'Humidity Too High', value: data.humidity, threshold: config.humidity_max });

      for (const alert of alerts) {
        await supabase.functions.invoke('send-alert-email', {
          body: {
            alertType: alert.type,
            value: alert.value,
            threshold: alert.threshold,
            timestamp: data.timestamp,
          },
        });
      }
    }

    const { data: autoCheck } = await supabase.functions.invoke('check-irrigation', {
      body: {
        soilMoisture: data.soilMoisture,
        soilMoisturePercentage: data.soilMoisturePercentage,
        temperature: data.temperature,
        humidity: data.humidity,
        dli: data.dli,
        isDay: data.isDay,
      },
    });

    if (autoCheck?.irrigation?.queued) console.log('Auto irrigation queued:', autoCheck.irrigation.reason);
    if (autoCheck?.fan?.queued) console.log('Auto fan queued:', autoCheck.fan.reason);
    if (autoCheck?.grow_light?.queued) console.log('Auto grow light queued:', autoCheck.grow_light.reason);
  };

  return { sensorData, isConnected };
}
