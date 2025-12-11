import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DataPoint {
  timestamp: string;
  moisture: number;
}

interface Insights {
  avgDryingRate: number | null;
  irrigationCycles: number;
  avgMoisture: number | null;
  pattern: string | null;
}

export function useSoilMoistureHistory(timeRange: '24h' | '7d' | '30d') {
  const { user } = useAuth();
  const [data, setData] = useState<DataPoint[]>([]);
  const [insights, setInsights] = useState<Insights>({
    avgDryingRate: null,
    irrigationCycles: 0,
    avgMoisture: null,
    pattern: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      
      // Calculate time range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('timestamp, soil_moisture, soil_moisture_percentage')
        .eq('user_id', user.id)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (readings && !error) {
        // Format data for chart
        const formatted = readings.map(reading => {
          // Use percentage if available, otherwise convert text to estimated percentage
          const moisture = reading.soil_moisture_percentage !== null 
            ? reading.soil_moisture_percentage 
            : (reading.soil_moisture === 'Wet' ? 60 : 20);
          
          // Format timestamp based on time range
          let timestamp: string;
          const date = new Date(reading.timestamp);
          if (timeRange === '24h') {
            timestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (timeRange === '7d') {
            timestamp = date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
          } else {
            timestamp = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
          
          return { timestamp, moisture };
        });

        // Downsample if too many points
        const maxPoints = timeRange === '24h' ? 48 : timeRange === '7d' ? 84 : 60;
        const downsampled = downsample(formatted, maxPoints);
        setData(downsampled);

        // Calculate insights
        calculateInsights(readings);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [user, timeRange]);

  const downsample = (data: DataPoint[], maxPoints: number): DataPoint[] => {
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  };

  const calculateInsights = (readings: any[]) => {
    if (readings.length < 2) {
      setInsights({
        avgDryingRate: null,
        irrigationCycles: 0,
        avgMoisture: null,
        pattern: null,
      });
      return;
    }

    // Calculate average moisture
    const moistureValues = readings.map(r => 
      r.soil_moisture_percentage !== null 
        ? r.soil_moisture_percentage 
        : (r.soil_moisture === 'Wet' ? 60 : 20)
    );
    const avgMoisture = moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length;

    // Calculate drying rate (looking at decreasing periods)
    let totalDryingRate = 0;
    let dryingPeriods = 0;
    
    for (let i = 1; i < moistureValues.length; i++) {
      const diff = moistureValues[i - 1] - moistureValues[i];
      if (diff > 0) {
        const timeDiff = (new Date(readings[i].timestamp).getTime() - 
                         new Date(readings[i - 1].timestamp).getTime()) / 3600000; // hours
        if (timeDiff > 0) {
          totalDryingRate += diff / timeDiff;
          dryingPeriods++;
        }
      }
    }
    
    const avgDryingRate = dryingPeriods > 0 ? totalDryingRate / dryingPeriods : null;

    // Count irrigation cycles (sudden increases in moisture)
    let irrigationCycles = 0;
    for (let i = 1; i < moistureValues.length; i++) {
      const increase = moistureValues[i] - moistureValues[i - 1];
      if (increase > 15) { // Significant increase indicates irrigation
        irrigationCycles++;
      }
    }

    // Generate pattern analysis
    let pattern: string | null = null;
    if (avgDryingRate !== null) {
      if (avgDryingRate > 5) {
        pattern = "Soil dries quickly - consider more frequent watering or mulching to retain moisture.";
      } else if (avgDryingRate < 1) {
        pattern = "Soil retains moisture well - ensure proper drainage to prevent waterlogging.";
      } else {
        pattern = "Normal drying pattern detected. Irrigation schedule appears effective.";
      }
      
      if (irrigationCycles === 0 && avgMoisture < 40) {
        pattern += " No irrigation detected recently - manual watering may be needed.";
      } else if (irrigationCycles > 5 && timeRange === '24h') {
        pattern += " Frequent irrigation detected - check for leaks or over-watering.";
      }
    }

    setInsights({
      avgDryingRate,
      irrigationCycles,
      avgMoisture,
      pattern,
    });
  };

  return { data, insights, isLoading };
}