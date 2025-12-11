import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AlertThresholds {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  soilMoistureMin: number;
  soilMoistureMax: number;
  batteryLowThreshold: number;
  sensorOfflineMinutes: number;
  emailAlerts: boolean;
  emailAddress: string;
}

export function useAlertConfig() {
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    tempMin: 15,
    tempMax: 35,
    humidityMin: 40,
    humidityMax: 80,
    soilMoistureMin: 30,
    soilMoistureMax: 70,
    batteryLowThreshold: 20,
    sensorOfflineMinutes: 10,
    emailAlerts: false,
    emailAddress: '',
  });

  useEffect(() => {
    if (!user) return;

    const loadConfig = async () => {
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setThresholds({
          tempMin: data.temp_min,
          tempMax: data.temp_max,
          humidityMin: data.humidity_min,
          humidityMax: data.humidity_max,
          soilMoistureMin: data.soil_moisture_min ?? 30,
          soilMoistureMax: data.soil_moisture_max ?? 70,
          batteryLowThreshold: data.battery_low_threshold ?? 20,
          sensorOfflineMinutes: data.sensor_offline_minutes ?? 10,
          emailAlerts: data.email_alerts,
          emailAddress: data.email_address || '',
        });
      } else if (!error) {
        // Create default config
        await supabase.from('alert_configurations').insert({
          user_id: user.id,
          temp_min: 15,
          temp_max: 35,
          humidity_min: 40,
          humidity_max: 80,
          soil_moisture_min: 30,
          soil_moisture_max: 70,
          battery_low_threshold: 20,
          sensor_offline_minutes: 10,
          email_alerts: false,
        });
      }
    };

    loadConfig();
  }, [user]);

  const saveThresholds = async (newThresholds: AlertThresholds) => {
    if (!user) return;

    const { error } = await supabase
      .from('alert_configurations')
      .upsert({
        user_id: user.id,
        temp_min: newThresholds.tempMin,
        temp_max: newThresholds.tempMax,
        humidity_min: newThresholds.humidityMin,
        humidity_max: newThresholds.humidityMax,
        soil_moisture_min: newThresholds.soilMoistureMin,
        soil_moisture_max: newThresholds.soilMoistureMax,
        battery_low_threshold: newThresholds.batteryLowThreshold,
        sensor_offline_minutes: newThresholds.sensorOfflineMinutes,
        email_alerts: newThresholds.emailAlerts,
        email_address: newThresholds.emailAddress,
      });

    if (error) {
      toast.error('Failed to save alert configuration');
      console.error('Error saving alert config:', error);
    } else {
      setThresholds(newThresholds);
      toast.success('Alert configuration saved');
    }
  };

  return { thresholds, saveThresholds };
}