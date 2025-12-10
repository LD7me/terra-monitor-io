import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { SystemConfig } from "@/components/SystemConfig";
import { AlertConfig } from "@/components/AlertConfig";
import { HistoricalData } from "@/components/HistoricalData";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DeviceControlPanel } from "@/components/DeviceControlPanel";
import { CommandHistory } from "@/components/CommandHistory";
import { DailySummary } from "@/components/DailySummary";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { Thermometer, Droplets, Sprout } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";

const Dashboard = () => {
  const { sensorData, isConnected } = useSensorData();

  const getStatusColor = (value: number, min: number, max: number) => {
    if (value < min) return "text-secondary";
    if (value > max) return "text-destructive";
    return "text-primary";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="container mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Live Dashboard</h1>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">Real-time greenhouse monitoring</p>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"} className="self-start sm:self-auto text-xs">
              {isConnected ? "Connected" : "Simulated"}
            </Badge>
          </div>

          {/* System Configuration */}
          <SystemConfig />

          {/* Connection Status & Battery */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start">
            <div className="flex-1">
              <Badge variant={isConnected ? "default" : "secondary"} className="gap-2 text-xs">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-primary-foreground animate-pulse' : 'bg-muted-foreground'}`} />
                {isConnected ? "Receiving Data" : "Not Connected"}
              </Badge>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                Last updated: {new Date(sensorData.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div className="w-full sm:w-64">
              <BatteryIndicator 
                percentage={sensorData.batteryPercentage}
                voltage={sensorData.batteryVoltage}
                isConnected={isConnected}
              />
            </div>
          </div>

          {/* Sensor Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Temperature Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Temperature</CardTitle>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">DHT22 Sensor Reading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${getStatusColor(sensorData.temperature, 20, 28)}`}>
                  {sensorData.temperature}°C
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  <Badge variant={sensorData.temperature >= 20 && sensorData.temperature <= 28 ? "default" : "destructive"}>
                    {sensorData.temperature >= 20 && sensorData.temperature <= 28 ? "Optimal" : "Alert"}
                  </Badge>
                  <span className="text-muted-foreground">Range: 20-28°C</span>
                </div>
              </CardContent>
            </Card>

            {/* Humidity Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Humidity</CardTitle>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">Relative Humidity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${getStatusColor(sensorData.humidity, 60, 80)}`}>
                  {sensorData.humidity}%
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  <Badge variant={sensorData.humidity >= 60 && sensorData.humidity <= 80 ? "default" : "destructive"}>
                    {sensorData.humidity >= 60 && sensorData.humidity <= 80 ? "Optimal" : "Alert"}
                  </Badge>
                  <span className="text-muted-foreground">Range: 60-80%</span>
                </div>
              </CardContent>
            </Card>

            {/* Soil Moisture Card */}
            <Card className="border-2 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Soil Moisture</CardTitle>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">Digital Sensor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${sensorData.soilMoisture === "Wet" ? "text-primary" : "text-destructive"}`}>
                  {sensorData.soilMoisture}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  <Badge variant={sensorData.soilMoisture === "Wet" ? "default" : "destructive"}>
                    {sensorData.soilMoisture === "Wet" ? "Healthy" : "Needs Water"}
                  </Badge>
                  <span className="text-muted-foreground">Auto-irrigation ready</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel & Daily Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <DeviceControlPanel sensorData={sensorData} />
            <DailySummary />
          </div>

          {/* Alerts, Weather, Command History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AlertConfig 
              currentTemp={sensorData.temperature}
              currentHumidity={sensorData.humidity}
              soilMoisture={sensorData.soilMoisture}
            />
            <WeatherWidget />
            <CommandHistory />
          </div>

          {/* Historical Data */}
          <HistoricalData />

          {/* Setup Instructions */}
          <Card className="border-2 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm">🚀 Quick Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span className="break-all">Install dependencies: <code className="bg-muted px-1 sm:px-2 py-1 rounded text-xs">pip install requests adafruit-circuitpython-dht</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Configure your USER_ID in the Pi script</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Run the script: <code className="bg-muted px-1 sm:px-2 py-1 rounded text-xs">python3 app.py</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>Data syncs to cloud automatically every 5 seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
