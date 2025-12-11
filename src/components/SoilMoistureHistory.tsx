import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Droplets, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { useSoilMoistureHistory } from "@/hooks/useSoilMoistureHistory";

interface SoilMoistureHistoryProps {
  thresholds: {
    min: number;
    max: number;
  };
}

export const SoilMoistureHistory = ({ thresholds }: SoilMoistureHistoryProps) => {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const { data, insights, isLoading } = useSoilMoistureHistory(timeRange);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-secondary" />
            <CardTitle className="text-base sm:text-lg">Soil Moisture Trends</CardTitle>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="24h" className="text-xs px-2 sm:px-3">24h</TabsTrigger>
              <TabsTrigger value="7d" className="text-xs px-2 sm:px-3">7 Days</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-2 sm:px-3">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Analyze drying patterns, irrigation effectiveness, and water usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Drying Rate</span>
            </div>
            <p className="text-sm sm:text-base font-semibold">
              {insights.avgDryingRate !== null ? `${insights.avgDryingRate.toFixed(1)}%/hr` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground">How fast soil dries</p>
          </div>
          
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Irrigation Cycles</span>
            </div>
            <p className="text-sm sm:text-base font-semibold">{insights.irrigationCycles}</p>
            <p className="text-[10px] text-muted-foreground">Times watered</p>
          </div>
          
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Moisture</span>
            </div>
            <p className="text-sm sm:text-base font-semibold">
              {insights.avgMoisture !== null ? `${insights.avgMoisture.toFixed(0)}%` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground">Overall level</p>
          </div>
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Loading data...
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="timestamp" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px"
                }}
                formatter={(value: number) => [`${value}%`, "Moisture"]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              
              {/* Threshold Reference Lines */}
              <ReferenceLine 
                y={thresholds.min} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ value: "Min", fill: "hsl(var(--destructive))", fontSize: 10 }}
              />
              <ReferenceLine 
                y={thresholds.max} 
                stroke="hsl(var(--secondary))" 
                strokeDasharray="5 5"
                label={{ value: "Max", fill: "hsl(var(--secondary))", fontSize: 10 }}
              />
              
              <Line 
                type="monotone" 
                dataKey="moisture" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Soil Moisture"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No soil moisture data available for this period
          </div>
        )}

        {/* Pattern Analysis */}
        {insights.pattern && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs sm:text-sm font-medium text-primary mb-1">Pattern Analysis</p>
            <p className="text-xs text-muted-foreground">{insights.pattern}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};