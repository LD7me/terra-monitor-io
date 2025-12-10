import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: "Wet" | "Dry";
  timestamp: string;
  batteryPercentage: number | null;
  batteryVoltage: number | null;
}

export function useSensorData() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    soilMoisture: "Dry",
    timestamp: new Date().toISOString(),
    batteryPercentage: null,
    batteryVoltage: null,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch latest reading from database
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          soilMoisture: data.soil_moisture as "Wet" | "Dry",
          timestamp: data.timestamp,
          batteryPercentage: data.battery_percentage ?? null,
          batteryVoltage: data.battery_voltage ?? null,
        });
        // Consider connected if we have recent data (within last 30 seconds)
        const lastUpdate = new Date(data.timestamp).getTime();
        const now = Date.now();
        setIsConnected(now - lastUpdate < 30000);
        
        // Check alerts
        await checkAlertsAndIrrigation({
          temperature: data.temperature,
          humidity: data.humidity,
          soilMoisture: data.soil_moisture as "Wet" | "Dry",
          timestamp: data.timestamp,
          batteryPercentage: data.battery_percentage ?? null,
          batteryVoltage: data.battery_voltage ?? null,
        });
      }
    };

    fetchLatest();

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
          const newReading = payload.new as any;
          setSensorData({
            temperature: newReading.temperature,
            humidity: newReading.humidity,
            soilMoisture: newReading.soil_moisture as "Wet" | "Dry",
            timestamp: newReading.timestamp,
            batteryPercentage: newReading.battery_percentage ?? null,
            batteryVoltage: newReading.battery_voltage ?? null,
          });
          setIsConnected(true);
          
          checkAlertsAndIrrigation({
            temperature: newReading.temperature,
            humidity: newReading.humidity,
            soilMoisture: newReading.soil_moisture as "Wet" | "Dry",
            timestamp: newReading.timestamp,
            batteryPercentage: newReading.battery_percentage ?? null,
            batteryVoltage: newReading.battery_voltage ?? null,
          });
        }
      )
      .subscribe();

    // Poll every 10 seconds as backup
    const interval = setInterval(fetchLatest, 10000);

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
            email: config.email_address,
            alertType: alert.type,
            value: alert.value,
            threshold: alert.threshold,
            timestamp: data.timestamp,
          },
        });
      }
    }

    // Check automated irrigation
    const { data: irrigationCheck } = await supabase.functions.invoke('check-irrigation', {
      body: {
        userId: user.id,
        soilMoisture: data.soilMoisture,
        temperature: data.temperature,
      },
    });

    if (irrigationCheck?.shouldIrrigate) {
      console.log('Automated irrigation triggered:', irrigationCheck.reason);
    }
  };

  return { sensorData, isConnected };
}
