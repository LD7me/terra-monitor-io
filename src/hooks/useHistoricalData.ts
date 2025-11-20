import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
}

export function useHistoricalData() {
  const { user } = useAuth();
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('temperature, humidity, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (readings && !error) {
        const formatted = readings.reverse().map(reading => ({
          timestamp: new Date(reading.timestamp).toLocaleTimeString(),
          temperature: reading.temperature,
          humidity: reading.humidity,
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
          const newReading = payload.new as any;
          setData(prev => {
            const updated = [...prev, {
              timestamp: new Date(newReading.timestamp).toLocaleTimeString(),
              temperature: newReading.temperature,
              humidity: newReading.humidity,
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

  return { data };
}
