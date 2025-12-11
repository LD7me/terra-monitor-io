import { Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryWarning, Wifi, WifiOff, Activity, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DeviceHealthProps {
  batteryPercentage: number | null;
  batteryVoltage: number | null;
  wifiSignalStrength: number | null;
  lastUpdate: string;
  isConnected: boolean;
}

export const DeviceHealth = ({ 
  batteryPercentage, 
  batteryVoltage, 
  wifiSignalStrength,
  lastUpdate,
  isConnected 
}: DeviceHealthProps) => {
  
  const getBatteryIcon = () => {
    if (batteryPercentage === null) return <Battery className="h-4 w-4 text-muted-foreground" />;
    if (batteryPercentage <= 10) return <BatteryWarning className="h-4 w-4 text-destructive" />;
    if (batteryPercentage <= 25) return <BatteryLow className="h-4 w-4 text-destructive" />;
    if (batteryPercentage <= 50) return <BatteryMedium className="h-4 w-4 text-accent" />;
    return <BatteryFull className="h-4 w-4 text-primary" />;
  };

  const getBatteryStatus = () => {
    if (batteryPercentage === null) return { text: "No data", variant: "secondary" as const };
    if (batteryPercentage <= 10) return { text: "Critical", variant: "destructive" as const };
    if (batteryPercentage <= 25) return { text: "Low", variant: "destructive" as const };
    if (batteryPercentage <= 50) return { text: "Medium", variant: "default" as const };
    return { text: "Good", variant: "default" as const };
  };

  const getWifiIcon = () => {
    if (!isConnected || wifiSignalStrength === null) return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    return <Wifi className="h-4 w-4 text-primary" />;
  };

  const getWifiStatus = () => {
    if (!isConnected) return { text: "Offline", variant: "destructive" as const, strength: 0 };
    if (wifiSignalStrength === null) return { text: "Unknown", variant: "secondary" as const, strength: 50 };
    if (wifiSignalStrength >= -50) return { text: "Excellent", variant: "default" as const, strength: 100 };
    if (wifiSignalStrength >= -60) return { text: "Good", variant: "default" as const, strength: 75 };
    if (wifiSignalStrength >= -70) return { text: "Fair", variant: "default" as const, strength: 50 };
    return { text: "Weak", variant: "destructive" as const, strength: 25 };
  };

  const getSensorStatus = () => {
    if (!isConnected) return { text: "Offline", variant: "destructive" as const };
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    const minutesAgo = (now - lastUpdateTime) / 60000;
    
    if (minutesAgo > 10) return { text: "Stale", variant: "destructive" as const };
    if (minutesAgo > 5) return { text: "Delayed", variant: "default" as const };
    return { text: "Active", variant: "default" as const };
  };

  const batteryStatus = getBatteryStatus();
  const wifiStatus = getWifiStatus();
  const sensorStatus = getSensorStatus();

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Device Health
          </CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-[10px]">
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sensor Status */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {sensorStatus.text === "Active" ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs sm:text-sm">Sensor Status</span>
          </div>
          <Badge variant={sensorStatus.variant} className="text-[10px]">
            {sensorStatus.text}
          </Badge>
        </div>

        {/* Battery Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getBatteryIcon()}
              <span className="text-xs sm:text-sm">Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {batteryPercentage !== null ? `${batteryPercentage}%` : "--"}
                {batteryVoltage !== null && ` (${batteryVoltage.toFixed(1)}V)`}
              </span>
              <Badge variant={batteryStatus.variant} className="text-[10px]">
                {batteryStatus.text}
              </Badge>
            </div>
          </div>
          <Progress value={batteryPercentage ?? 0} className="h-1.5" />
        </div>

        {/* WiFi Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getWifiIcon()}
              <span className="text-xs sm:text-sm">WiFi Signal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {wifiSignalStrength !== null ? `${wifiSignalStrength} dBm` : "--"}
              </span>
              <Badge variant={wifiStatus.variant} className="text-[10px]">
                {wifiStatus.text}
              </Badge>
            </div>
          </div>
          <Progress value={wifiStatus.strength} className="h-1.5" />
        </div>

        {/* Last Update */}
        <div className="text-[10px] text-muted-foreground text-center pt-1 border-t">
          Last update: {new Date(lastUpdate).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};