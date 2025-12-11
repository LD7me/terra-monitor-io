import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  soil_moisture?: string;
}

interface RawReading {
  temperature: number;
  humidity: number;
  timestamp: string;
  soil_moisture: string;
  soil_moisture_percentage: number | null;
}

export function useHistoricalData() {
  const { user } = useAuth();
  const [data, setData] = useState<DataPoint[]>([]);
  const [rawData, setRawData] = useState<RawReading[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('temperature, humidity, timestamp, soil_moisture, soil_moisture_percentage')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (readings && !error) {
        const reversed = [...readings].reverse();
        setRawData(reversed);
        
        const formatted = reversed.map(reading => ({
          timestamp: new Date(reading.timestamp).toLocaleTimeString(),
          temperature: reading.temperature,
          humidity: reading.humidity,
          soil_moisture: reading.soil_moisture,
        }));
        setData(formatted);
      }
    };

    loadData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sensor_readings_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newReading = payload.new as RawReading;
          setRawData(prev => {
            const updated = [...prev, newReading];
            return updated.slice(-50);
          });
          setData(prev => {
            const updated = [...prev, {
              timestamp: new Date(newReading.timestamp).toLocaleTimeString(),
              temperature: newReading.temperature,
              humidity: newReading.humidity,
              soil_moisture: newReading.soil_moisture,
            }];
            return updated.slice(-50);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const exportToCSV = () => {
    if (rawData.length === 0) return;

    const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Soil Moisture'];
    const rows = rawData.map(r => [
      new Date(r.timestamp).toISOString(),
      r.temperature.toString(),
      r.humidity.toString(),
      r.soil_moisture,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `greenhouse_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { data, rawData, exportToCSV };
}
