import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { SystemConfig } from "@/components/SystemConfig";
import { AlertConfig } from "@/components/AlertConfig";
import { HistoricalData } from "@/components/HistoricalData";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DeviceControlPanel } from "@/components/DeviceControlPanel";
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
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Live Dashboard</h1>
              <p className="text-muted-foreground">Real-time greenhouse environmental monitoring</p>
            </div>
            <div className="flex gap-3">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Simulated"}
              </Badge>
            </div>
          </div>

          {/* System Configuration */}
          <div className="mb-8">
            <SystemConfig />
          </div>

          {/* Connection Status */}
          <div className="mb-6">
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-primary-foreground animate-pulse' : 'bg-muted-foreground'}`} />
              {isConnected ? "Receiving Data from Cloud" : "Not Connected"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(sensorData.timestamp).toLocaleTimeString()}
            </p>
          </div>

          {/* Sensor Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Temperature Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Temperature</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Thermometer className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardDescription>DHT22 Sensor Reading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${getStatusColor(sensorData.temperature, 20, 28)}`}>
                  {sensorData.temperature}°C
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={sensorData.temperature >= 20 && sensorData.temperature <= 28 ? "default" : "destructive"}>
                    {sensorData.temperature >= 20 && sensorData.temperature <= 28 ? "Optimal" : "Alert"}
                  </Badge>
                  <span className="text-muted-foreground">Range: 20-28°C</span>
                </div>
              </CardContent>
            </Card>

            {/* Humidity Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Humidity</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-secondary" />
                  </div>
                </div>
                <CardDescription>Relative Humidity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${getStatusColor(sensorData.humidity, 60, 80)}`}>
                  {sensorData.humidity}%
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={sensorData.humidity >= 60 && sensorData.humidity <= 80 ? "default" : "destructive"}>
                    {sensorData.humidity >= 60 && sensorData.humidity <= 80 ? "Optimal" : "Alert"}
                  </Badge>
                  <span className="text-muted-foreground">Range: 60-80%</span>
                </div>
              </CardContent>
            </Card>

            {/* Soil Moisture Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Soil Moisture</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sprout className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <CardDescription>Digital Sensor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${sensorData.soilMoisture === "Wet" ? "text-primary" : "text-destructive"}`}>
                  {sensorData.soilMoisture}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={sensorData.soilMoisture === "Wet" ? "default" : "destructive"}>
                    {sensorData.soilMoisture === "Wet" ? "Healthy" : "Needs Water"}
                  </Badge>
                  <span className="text-muted-foreground">Auto-irrigation ready</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <DeviceControlPanel sensorData={sensorData} />

          {/* New Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <AlertConfig 
              currentTemp={sensorData.temperature}
              currentHumidity={sensorData.humidity}
              soilMoisture={sensorData.soilMoisture}
            />
            <WeatherWidget />
          </div>

          {/* Historical Data */}
          <div className="mt-6">
            <HistoricalData />
          </div>

          {/* Setup Instructions */}
          <Card className="mt-6 border-2 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm">🚀 Quick Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Install dependencies: <code className="bg-muted px-2 py-1 rounded">pip install requests adafruit-circuitpython-dht</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Configure your USER_ID in the Pi script</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Run the script: <code className="bg-muted px-2 py-1 rounded">python3 app.py</code></span>
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
