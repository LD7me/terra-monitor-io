import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Bell, Settings } from "lucide-react";
import { toast } from "sonner";

interface AlertThresholds {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

interface AlertConfigProps {
  currentTemp: number;
  currentHumidity: number;
  soilMoisture: string;
}

export const AlertConfig = ({ currentTemp, currentHumidity, soilMoisture }: AlertConfigProps) => {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    tempMin: 20,
    tempMax: 28,
    humidityMin: 60,
    humidityMax: 80,
  });

  const [showConfig, setShowConfig] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("alert_thresholds");
    if (saved) {
      setThresholds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const newAlerts: string[] = [];
    
    if (currentTemp < thresholds.tempMin) {
      newAlerts.push(`Temperature too low: ${currentTemp}°C (min: ${thresholds.tempMin}°C)`);
    }
    if (currentTemp > thresholds.tempMax) {
      newAlerts.push(`Temperature too high: ${currentTemp}°C (max: ${thresholds.tempMax}°C)`);
    }
    if (currentHumidity < thresholds.humidityMin) {
      newAlerts.push(`Humidity too low: ${currentHumidity}% (min: ${thresholds.humidityMin}%)`);
    }
    if (currentHumidity > thresholds.humidityMax) {
      newAlerts.push(`Humidity too high: ${currentHumidity}% (max: ${thresholds.humidityMax}%)`);
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
  }, [currentTemp, currentHumidity, soilMoisture, thresholds]);

  const saveThresholds = () => {
    localStorage.setItem("alert_thresholds", JSON.stringify(thresholds));
    toast.success("Alert thresholds saved");
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
                  value={thresholds.tempMin}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, tempMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempMax">Temperature Max (°C)</Label>
                <Input
                  id="tempMax"
                  type="number"
                  value={thresholds.tempMax}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, tempMax: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidityMin">Humidity Min (%)</Label>
                <Input
                  id="humidityMin"
                  type="number"
                  value={thresholds.humidityMin}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, humidityMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidityMax">Humidity Max (%)</Label>
                <Input
                  id="humidityMax"
                  type="number"
                  value={thresholds.humidityMax}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, humidityMax: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <Button onClick={saveThresholds} className="w-full">
              Save Thresholds
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
