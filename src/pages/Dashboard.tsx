import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { SystemConfig } from "@/components/SystemConfig";
import { HistoricalData } from "@/components/HistoricalData";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DeviceControlPanel } from "@/components/DeviceControlPanel";
import { CommandHistory } from "@/components/CommandHistory";
import { DailySummary } from "@/components/DailySummary";
import { DeviceHealth } from "@/components/DeviceHealth";
import { SoilMoistureCard } from "@/components/SoilMoistureCard";
import { SoilMoistureHistory } from "@/components/SoilMoistureHistory";
import { EnhancedAlerts } from "@/components/EnhancedAlerts";
import { AlertConfigDialog } from "@/components/AlertConfigDialog";
import { AutoControlStatus } from "@/components/AutoControlStatus";
import { Thermometer, Droplets, Sun } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useAlertConfig } from "@/hooks/useAlertConfig";

const Dashboard = () => {
  const { sensorData, isConnected } = useSensorData();
  const { thresholds, saveThresholds } = useAlertConfig();
  const [showConfigDialog, setShowConfigDialog] = useState(false);

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

          {/* Device Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DeviceHealth 
              batteryPercentage={sensorData.batteryPercentage}
              batteryVoltage={sensorData.batteryVoltage}
              wifiSignalStrength={sensorData.wifiSignalStrength}
              lastUpdate={sensorData.timestamp}
              isConnected={isConnected}
            />
            <div className="flex flex-col gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="gap-2 text-xs self-start">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-primary-foreground animate-pulse' : 'bg-muted-foreground'}`} />
                {isConnected ? "Receiving Data" : "Not Connected"}
              </Badge>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Last updated: {new Date(sensorData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sensor Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Temperature Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Temperature</CardTitle>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">DHT11 via Arduino</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${getStatusColor(sensorData.temperature, thresholds.tempMin, thresholds.tempMax)}`}>
                  {sensorData.temperature}°C
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  <Badge variant={sensorData.temperature >= thresholds.tempMin && sensorData.temperature <= thresholds.tempMax ? "default" : "destructive"}>
                    {sensorData.temperature >= thresholds.tempMin && sensorData.temperature <= thresholds.tempMax ? "Optimal" : "Alert"}
                  </Badge>
                  <span className="text-muted-foreground">Range: {thresholds.tempMin}-{thresholds.tempMax}°C</span>
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
                <CardDescription className="text-xs sm:text-sm">DHT11 via Arduino</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${getStatusColor(sensorData.humidity, thresholds.humidityMin, thresholds.humidityMax)}`}>
                  {sensorData.humidity}%
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  <Badge variant={sensorData.humidity >= thresholds.humidityMin && sensorData.humidity <= thresholds.humidityMax ? "default" : "destructive"}>
                    {sensorData.humidity >= thresholds.humidityMin && sensorData.humidity <= thresholds.humidityMax ? "Optimal" : "Alert"}
                  </Badge>
                  <span className="text-muted-foreground">Range: {thresholds.humidityMin}-{thresholds.humidityMax}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Light Intensity Card */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Light</CardTitle>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">Light Sensor via Arduino</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl sm:text-4xl font-bold mb-2 ${sensorData.lightIntensity !== null ? getStatusColor(sensorData.lightIntensity, thresholds.lightMin, thresholds.lightMax) : 'text-muted-foreground'}`}>
                  {sensorData.lightIntensity !== null ? sensorData.lightIntensity : '—'}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  {sensorData.lightIntensity !== null ? (
                    <>
                      <Badge variant={sensorData.lightIntensity >= thresholds.lightMin && sensorData.lightIntensity <= thresholds.lightMax ? "default" : "destructive"}>
                        {sensorData.lightIntensity >= thresholds.lightMin && sensorData.lightIntensity <= thresholds.lightMax ? "Optimal" : "Alert"}
                      </Badge>
                      <span className="text-muted-foreground">Range: {thresholds.lightMin}-{thresholds.lightMax}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No data yet</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Soil Moisture Card */}
            <SoilMoistureCard 
              soilMoisture={sensorData.soilMoisture}
              soilMoisturePercentage={sensorData.soilMoisturePercentage}
              lastUpdate={sensorData.timestamp}
              thresholds={{
                min: thresholds.soilMoistureMin,
                max: thresholds.soilMoistureMax,
              }}
            />
          </div>

          {/* Soil Moisture History */}
          <SoilMoistureHistory 
            thresholds={{
              min: thresholds.soilMoistureMin,
              max: thresholds.soilMoistureMax,
            }}
          />

          {/* Control Panel & Auto-Control Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <DeviceControlPanel sensorData={sensorData} />
            <AutoControlStatus
              thresholds={{
                soilMoistureMin: thresholds.soilMoistureMin,
                soilMoistureMax: thresholds.soilMoistureMax,
                tempMax: thresholds.tempMax,
                humidityMax: thresholds.humidityMax,
              }}
            />
          </div>

          {/* Daily Summary */}
          <DailySummary />

          {/* Alerts, Weather, Command History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <EnhancedAlerts 
              currentTemp={sensorData.temperature}
              currentHumidity={sensorData.humidity}
              soilMoisture={sensorData.soilMoisture}
              soilMoisturePercentage={sensorData.soilMoisturePercentage}
              batteryPercentage={sensorData.batteryPercentage}
              isConnected={isConnected}
              lastUpdate={sensorData.timestamp}
              thresholds={thresholds}
              onConfigureClick={() => setShowConfigDialog(true)}
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
                  <span className="break-all">Upload Arduino sketch to read sensors (DHT11, Light, Soil Moisture)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Connect Arduino to Raspberry Pi via USB serial</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Configure USER_ID in the Pi script and run: <code className="bg-muted px-1 sm:px-2 py-1 rounded text-xs">python3 app.py</code></span>
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

      {/* Alert Config Dialog */}
      <AlertConfigDialog 
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        thresholds={thresholds}
        onSave={saveThresholds}
      />
    </div>
  );
};

export default Dashboard;