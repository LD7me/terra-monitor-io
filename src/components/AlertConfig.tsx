import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Bell, Settings, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAlertConfig } from "@/hooks/useAlertConfig";

interface AlertConfigProps {
  currentTemp: number;
  currentHumidity: number;
  soilMoisture: string;
}

export const AlertConfig = ({ currentTemp, currentHumidity, soilMoisture }: AlertConfigProps) => {
  const { thresholds, saveThresholds } = useAlertConfig();
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [showConfig, setShowConfig] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  useEffect(() => {
    const newAlerts: string[] = [];
    
    if (currentTemp < localThresholds.tempMin) {
      newAlerts.push(`Temperature too low: ${currentTemp}°C (min: ${localThresholds.tempMin}°C)`);
    }
    if (currentTemp > localThresholds.tempMax) {
      newAlerts.push(`Temperature too high: ${currentTemp}°C (max: ${localThresholds.tempMax}°C)`);
    }
    if (currentHumidity < localThresholds.humidityMin) {
      newAlerts.push(`Humidity too low: ${currentHumidity}% (min: ${localThresholds.humidityMin}%)`);
    }
    if (currentHumidity > localThresholds.humidityMax) {
      newAlerts.push(`Humidity too high: ${currentHumidity}% (max: ${localThresholds.humidityMax}%)`);
    }
    if (soilMoisture === "Dry") {
      newAlerts.push("Soil moisture is dry - irrigation recommended");
    }

    if (newAlerts.length > 0 && alerts.length === 0) {
      toast.error("Environmental Alert!", {
        description: newAlerts[0],
      });
    }

    setAlerts(newAlerts);
  }, [currentTemp, currentHumidity, soilMoisture, localThresholds]);

  const handleSaveThresholds = () => {
    saveThresholds(localThresholds);
    setShowConfig(false);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Environmental Alerts</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
        <CardDescription>
          Real-time monitoring with threshold notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert}</AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription className="text-primary">
              All environmental parameters within normal range
            </AlertDescription>
          </Alert>
        )}

        {showConfig && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempMin">Temperature Min (°C)</Label>
                <Input
                  id="tempMin"
                  type="number"
                  value={localThresholds.tempMin}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, tempMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempMax">Temperature Max (°C)</Label>
                <Input
                  id="tempMax"
                  type="number"
                  value={localThresholds.tempMax}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, tempMax: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidityMin">Humidity Min (%)</Label>
                <Input
                  id="humidityMin"
                  type="number"
                  value={localThresholds.humidityMin}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, humidityMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidityMax">Humidity Max (%)</Label>
                <Input
                  id="humidityMax"
                  type="number"
                  value={localThresholds.humidityMax}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, humidityMax: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <Button onClick={handleSaveThresholds} className="w-full">
              Save Thresholds
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
