import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { SystemConfig } from "@/components/SystemConfig";
import { DeviceControlPanel } from "@/components/DeviceControlPanel";
import { SoilMoistureCard } from "@/components/SoilMoistureCard";
import { ConsumptionCharts } from "@/components/ConsumptionCharts";
import { Thermometer, Droplets, Sun } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";

const Dashboard = () => {
  const { sensorData, isConnected } = useSensorData();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">Live Dashboard</h1>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                Real-time greenhouse monitoring · stored locally on the Pi
              </p>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"} className="self-start sm:self-auto text-xs">
              {isConnected ? "Connected" : "Offline"}
            </Badge>
          </div>

          {/* Pi connection */}
          <SystemConfig />

          {/* Sensor cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Temperature</CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Thermometer className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-xs">DHT11 via Arduino</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl sm:text-4xl font-bold mb-1 text-primary">
                  {sensorData.temperature?.toFixed?.(1) ?? sensorData.temperature}°C
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Humidity</CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Droplets className="h-4 w-4 text-secondary" />
                  </div>
                </div>
                <CardDescription className="text-xs">DHT11 via Arduino</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl sm:text-4xl font-bold mb-1 text-secondary">
                  {sensorData.humidity ?? 0}%
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Light</CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sun className="h-4 w-4 text-accent" />
                  </div>
                </div>
                <CardDescription className="text-xs">Arduino light sensor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl sm:text-4xl font-bold mb-1">
                  {sensorData.lightIntensity != null ? Math.round(sensorData.lightIntensity) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">lux</p>
              </CardContent>
            </Card>

            <SoilMoistureCard
              soilMoisture={sensorData.soilMoisture}
              soilMoisturePercentage={sensorData.soilMoisturePercentage}
              lastUpdate={sensorData.timestamp}
              thresholds={{ min: 30, max: 70 }}
            />
          </div>

          {/* Device controls */}
          <DeviceControlPanel sensorData={sensorData} />

          {/* Consumption */}
          <ConsumptionCharts />

          <p className="text-[11px] text-muted-foreground text-center pt-2">
            Last update: {new Date(sensorData.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
