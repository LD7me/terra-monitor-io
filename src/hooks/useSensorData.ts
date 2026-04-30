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

export function useSensorData() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    soilMoisture: 'Unknown',
    soilMoisturePercentage: null,
    lightIntensity: null,
    timestamp: new Date().toISOString(),
    batteryPercentage: null,
    batteryVoltage: null,
    wifiSignalStrength: null,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch initial data
    const fetchLatestReading = async () => {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const newData = {
          temperature: data.temperature,
          humidity: data.humidity,
          soilMoisture: data.soil_moisture,
          soilMoisturePercentage: data.soil_moisture_percentage,
          lightIntensity: (data as any).light_intensity ?? null,
          timestamp: data.timestamp,
          batteryPercentage: data.battery_percentage,
          batteryVoltage: data.battery_voltage,
          wifiSignalStrength: data.wifi_signal_strength,
        };
        setSensorData(newData);
        
        // Check if data is recent (within last 30 seconds)
        const lastUpdate = new Date(data.timestamp).getTime();
        const now = Date.now();
        setIsConnected(now - lastUpdate < 30000);
        
        // Check alerts and irrigation
        checkAlertsAndIrrigation(newData);
      }
    };

    fetchLatestReading();

    // Subscribe to realtime updates
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
          const newData = payload.new as any;
          const formattedData = {
            temperature: newData.temperature,
            humidity: newData.humidity,
            soilMoisture: newData.soil_moisture,
            soilMoisturePercentage: newData.soil_moisture_percentage,
            lightIntensity: newData.light_intensity ?? null,
            timestamp: newData.timestamp,
            batteryPercentage: newData.battery_percentage,
            batteryVoltage: newData.battery_voltage,
            wifiSignalStrength: newData.wifi_signal_strength,
          };
          setSensorData(formattedData);
          setIsConnected(true);
          checkAlertsAndIrrigation(formattedData);
        }
      )
      .subscribe();

    // Poll every 10 seconds as backup
    const interval = setInterval(fetchLatestReading, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const checkAlertsAndIrrigation = async (data: SensorData) => {
    if (!user) return;

    // Get user's alert configuration
    const { data: config } = await supabase
      .from('alert_configurations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!config) return;

    // Check for threshold breaches and send email alerts if enabled
    if (config.email_alerts && config.email_address) {
      const alerts: { type: string; value: number; threshold: number }[] = [];

      if (data.temperature < config.temp_min) {
        alerts.push({ type: 'Temperature Too Low', value: data.temperature, threshold: config.temp_min });
      }
      if (data.temperature > config.temp_max) {
        alerts.push({ type: 'Temperature Too High', value: data.temperature, threshold: config.temp_max });
      }
      if (data.humidity < config.humidity_min) {
        alerts.push({ type: 'Humidity Too Low', value: data.humidity, threshold: config.humidity_min });
      }
      if (data.humidity > config.humidity_max) {
        alerts.push({ type: 'Humidity Too High', value: data.humidity, threshold: config.humidity_max });
      }

      // Send email alerts
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

    // Automatic relay control based on thresholds
    const { data: autoCheck } = await supabase.functions.invoke('check-irrigation', {
      body: {
        soilMoisture: data.soilMoisture,
        soilMoisturePercentage: data.soilMoisturePercentage,
        temperature: data.temperature,
        humidity: data.humidity,
      },
    });

    if (autoCheck?.irrigation?.queued) {
      console.log('Auto irrigation queued:', autoCheck.irrigation.reason);
    }
    if (autoCheck?.fan?.queued) {
      console.log('Auto fan queued:', autoCheck.fan.reason);
    }
  };

  return { sensorData, isConnected };
}