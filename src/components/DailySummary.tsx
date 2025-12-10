import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Thermometer, Droplets, Sprout, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyStats {
  avgTemp: number;
  avgHumidity: number;
  irrigationCycles: number;
  totalReadings: number;
}

export const DailySummary = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    avgTemp: 0,
    avgHumidity: 0,
    irrigationCycles: 0,
    totalReadings: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's sensor readings
      const { data: readings } = await supabase
        .from('sensor_readings')
        .select('temperature, humidity')
        .eq('user_id', user.id)
        .gte('timestamp', today.toISOString());

      // Get today's irrigation logs
      const { data: irrigationLogs } = await supabase
        .from('irrigation_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('timestamp', today.toISOString());

      if (readings && readings.length > 0) {
        const avgTemp = readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length;
        const avgHumidity = readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length;

        setStats({
          avgTemp: Math.round(avgTemp * 10) / 10,
          avgHumidity: Math.round(avgHumidity * 10) / 10,
          irrigationCycles: irrigationLogs?.length || 0,
          totalReadings: readings.length,
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [user]);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>Today's Summary</CardTitle>
        </div>
        <CardDescription>Daily statistics overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Temp</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.avgTemp}°C</p>
          </div>

          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Humidity</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.avgHumidity}%</p>
          </div>

          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Sprout className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Irrigations</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.irrigationCycles}</p>
          </div>

          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Readings</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.totalReadings}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
