import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSensorData as fetchFromPi, getSystemConfig } from '@/lib/api';

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: "Wet" | "Dry";
  timestamp: string;
}

export function useSensorData() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 24.5,
    humidity: 65,
    soilMoisture: "Wet",
    timestamp: new Date().toISOString(),
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const config = getSystemConfig();
      
      try {
        if (config) {
          // Try to fetch from Raspberry Pi
          const data = await fetchFromPi();
          const newData = {
            temperature: data.temperature,
            humidity: data.humidity,
            soilMoisture: data.soil_moisture as "Wet" | "Dry",
            timestamp: data.timestamp,
          };
          setSensorData(newData);
          setIsConnected(true);

          // Save to database
          await supabase.from('sensor_readings').insert({
            user_id: user.id,
            temperature: data.temperature,
            humidity: data.humidity,
            soil_moisture: data.soil_moisture,
            timestamp: data.timestamp,
          });

          // Check for alerts and automated irrigation
          await checkAlertsAndIrrigation(newData);
        } else {
          // Simulated data when no Pi is connected
          const simulated = {
            temperature: Number((23 + Math.random() * 4).toFixed(1)),
            humidity: Number((60 + Math.random() * 15).toFixed(0)),
            soilMoisture: Math.random() > 0.5 ? "Wet" : "Dry" as "Wet" | "Dry",
            timestamp: new Date().toISOString(),
          };
          setSensorData(simulated);
          setIsConnected(false);

          // Still save simulated data
          await supabase.from('sensor_readings').insert({
            user_id: user.id,
            temperature: simulated.temperature,
            humidity: simulated.humidity,
            soil_moisture: simulated.soilMoisture,
          });
        }
      } catch (error) {
        console.error("Failed to fetch sensor data:", error);
        setIsConnected(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
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
