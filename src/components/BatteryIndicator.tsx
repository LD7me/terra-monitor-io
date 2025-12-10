import { Battery, BatteryCharging, BatteryLow, BatteryMedium, BatteryFull, BatteryWarning, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BatteryIndicatorProps {
  percentage: number | null;
  voltage: number | null;
  isConnected: boolean;
}

export const BatteryIndicator = ({ percentage, voltage, isConnected }: BatteryIndicatorProps) => {
  const getBatteryIcon = () => {
    if (percentage === null) return <Battery className="h-5 w-5 text-muted-foreground" />;
    if (percentage <= 10) return <BatteryWarning className="h-5 w-5 text-destructive" />;
    if (percentage <= 25) return <BatteryLow className="h-5 w-5 text-destructive" />;
    if (percentage <= 50) return <BatteryMedium className="h-5 w-5 text-accent" />;
    if (percentage <= 75) return <BatteryMedium className="h-5 w-5 text-primary" />;
    return <BatteryFull className="h-5 w-5 text-primary" />;
  };

  const getBatteryColor = () => {
    if (percentage === null) return "bg-muted";
    if (percentage <= 10) return "bg-destructive";
    if (percentage <= 25) return "bg-destructive";
    if (percentage <= 50) return "bg-accent";
    return "bg-primary";
  };

  const getStatusText = () => {
    if (percentage === null) return "No data";
    if (percentage <= 10) return "Critical";
    if (percentage <= 25) return "Low";
    if (percentage <= 50) return "Medium";
    if (percentage <= 75) return "Good";
    return "Full";
  };

  return (
    <Card className="border-2">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10">
            {getBatteryIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium">Battery</span>
                <Zap className="h-3 w-3 text-accent" />
              </div>
              <Badge 
                variant={percentage === null ? "secondary" : percentage <= 25 ? "destructive" : "default"}
                className="text-[10px] sm:text-xs"
              >
                {getStatusText()}
              </Badge>
            </div>
            <div className="space-y-1">
              <Progress 
                value={percentage ?? 0} 
                className="h-2"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                <span>{percentage !== null ? `${percentage}%` : "--"}</span>
                <span>{voltage !== null ? `${voltage.toFixed(1)}V` : "--"}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
