import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Database } from "lucide-react";

interface DataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
}

interface HistoricalDataProps {
  currentTemp: number;
  currentHumidity: number;
  timestamp: string;
}

export const HistoricalData = ({ currentTemp, currentHumidity, timestamp }: HistoricalDataProps) => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("sensor_history");
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    setData((prev) => {
      const newPoint: DataPoint = {
        timestamp: new Date(timestamp).toLocaleTimeString(),
        temperature: currentTemp,
        humidity: currentHumidity,
      };

      const updated = [...prev, newPoint];
      const last50 = updated.slice(-50);
      
      localStorage.setItem("sensor_history", JSON.stringify(last50));
      return last50;
    });
  }, [currentTemp, currentHumidity, timestamp]);

  const clearHistory = () => {
    localStorage.removeItem("sensor_history");
    setData([]);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Historical Trends</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            {data.length} data points
          </div>
        </div>
        <CardDescription>
          Last 50 sensor readings with trend analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="timestamp" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Temperature (°C)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                name="Humidity (%)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Collecting data... Charts will appear after a few readings
          </div>
        )}
      </CardContent>
    </Card>
  );
};
