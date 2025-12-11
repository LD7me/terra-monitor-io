import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Droplets, Battery, Wifi, Thermometer, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EnhancedAlertsProps {
  currentTemp: number;
  currentHumidity: number;
  soilMoisture: string;
  soilMoisturePercentage: number | null;
  batteryPercentage: number | null;
  isConnected: boolean;
  lastUpdate: string;
  thresholds: {
    tempMin: number;
    tempMax: number;
    humidityMin: number;
    humidityMax: number;
    soilMoistureMin: number;
    soilMoistureMax: number;
    batteryLowThreshold: number;
    sensorOfflineMinutes: number;
  };
  onConfigureClick: () => void;
}

interface AlertItem {
  id: string;
  type: "critical" | "warning" | "info";
  icon: typeof AlertTriangle;
  title: string;
  message: string;
}

export const EnhancedAlerts = ({
  currentTemp,
  currentHumidity,
  soilMoisture,
  soilMoisturePercentage,
  batteryPercentage,
  isConnected,
  lastUpdate,
  thresholds,
  onConfigureClick,
}: EnhancedAlertsProps) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [previousAlertCount, setPreviousAlertCount] = useState(0);

  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    // Temperature alerts
    if (currentTemp < thresholds.tempMin) {
      newAlerts.push({
        id: "temp_low",
        type: "warning",
        icon: Thermometer,
        title: "Low Temperature",
        message: `Temperature ${currentTemp}°C is below minimum ${thresholds.tempMin}°C`,
      });
    }
    if (currentTemp > thresholds.tempMax) {
      newAlerts.push({
        id: "temp_high",
        type: "warning",
        icon: Thermometer,
        title: "High Temperature",
        message: `Temperature ${currentTemp}°C exceeds maximum ${thresholds.tempMax}°C`,
      });
    }

    // Humidity alerts
    if (currentHumidity < thresholds.humidityMin) {
      newAlerts.push({
        id: "humidity_low",
        type: "warning",
        icon: Droplets,
        title: "Low Humidity",
        message: `Humidity ${currentHumidity}% is below minimum ${thresholds.humidityMin}%`,
      });
    }
    if (currentHumidity > thresholds.humidityMax) {
      newAlerts.push({
        id: "humidity_high",
        type: "warning",
        icon: Droplets,
        title: "High Humidity",
        message: `Humidity ${currentHumidity}% exceeds maximum ${thresholds.humidityMax}%`,
      });
    }

    // Soil moisture alerts
    const moistureValue = soilMoisturePercentage ?? (soilMoisture === "Wet" ? 60 : 20);
    if (moistureValue < thresholds.soilMoistureMin || soilMoisture === "Dry") {
      newAlerts.push({
        id: "soil_dry",
        type: "critical",
        icon: Droplets,
        title: "Soil Too Dry",
        message: `Soil moisture is critically low - immediate irrigation recommended`,
      });
    }
    if (moistureValue > thresholds.soilMoistureMax) {
      newAlerts.push({
        id: "soil_wet",
        type: "warning",
        icon: Droplets,
        title: "Soil Too Wet",
        message: `Soil moisture ${moistureValue}% exceeds ${thresholds.soilMoistureMax}% - pause irrigation`,
      });
    }

    // Battery low alert
    if (batteryPercentage !== null && batteryPercentage <= thresholds.batteryLowThreshold) {
      newAlerts.push({
        id: "battery_low",
        type: batteryPercentage <= 10 ? "critical" : "warning",
        icon: Battery,
        title: "Battery Low",
        message: `Battery at ${batteryPercentage}% - charge or replace soon`,
      });
    }

    // Sensor offline alert
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const minutesAgo = (Date.now() - lastUpdateTime) / 60000;
    if (!isConnected || minutesAgo > thresholds.sensorOfflineMinutes) {
      newAlerts.push({
        id: "sensor_offline",
        type: "critical",
        icon: Wifi,
        title: "Sensor Offline",
        message: isConnected 
          ? `No data received for ${Math.floor(minutesAgo)} minutes`
          : "Sensor connection lost - check device",
      });
    }

    // Show toast for new alerts
    if (newAlerts.length > previousAlertCount) {
      const criticalAlerts = newAlerts.filter(a => a.type === "critical");
      if (criticalAlerts.length > 0) {
        toast.error("Critical Alert!", {
          description: criticalAlerts[0].message,
        });
      }
    }

    setPreviousAlertCount(newAlerts.length);
    setAlerts(newAlerts);
  }, [currentTemp, currentHumidity, soilMoisture, soilMoisturePercentage, batteryPercentage, isConnected, lastUpdate, thresholds]);

  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Alerts & Notifications</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onConfigureClick}>
            <Settings className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Configure</span>
          </Button>
        </div>
        <div className="flex gap-2 mt-1">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {criticalCount} Critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="default" className="text-[10px]">
              {warningCount} Warning
            </Badge>
          )}
          {alerts.length === 0 && (
            <Badge variant="secondary" className="text-[10px]">
              All Clear
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <Alert 
                key={alert.id} 
                variant={alert.type === "critical" ? "destructive" : "default"}
                className="py-2"
              >
                <Icon className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <span className="font-medium text-xs sm:text-sm">{alert.title}</span>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{alert.message}</p>
                </AlertDescription>
              </Alert>
            );
          })
        ) : (
          <Alert className="py-2">
            <AlertDescription className="text-primary text-xs sm:text-sm">
              All environmental parameters within normal range
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};