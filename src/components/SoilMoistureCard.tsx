import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Droplets } from "lucide-react";

interface SoilMoistureCardProps {
  soilMoisture: string;             // "Wet" | "Dry" | "Moist" | "Unknown"
  lastUpdate: string;
  lastIrrigationAt?: string | null; // ISO timestamp of most recent pump ON
}

const formatRelative = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const SoilMoistureCard = ({
  soilMoisture,
  lastUpdate,
  lastIrrigationAt,
}: SoilMoistureCardProps) => {
  const isDry = soilMoisture === "Dry";
  const isWet = soilMoisture === "Wet";

  const color = isDry ? "text-destructive" : isWet ? "text-primary" : "text-muted-foreground";
  const badgeVariant = isDry ? "destructive" : isWet ? "default" : "secondary";

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Soil Moisture</CardTitle>
          <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sprout className="h-4 w-4 text-accent" />
          </div>
        </div>
        <CardDescription className="text-xs">
          Qualitative reading (control-limit based)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={`text-3xl sm:text-4xl font-bold ${color}`}>{soilMoisture}</div>
        <Badge variant={badgeVariant} className="text-[10px]">
          {isDry ? "Needs water" : isWet ? "Healthy" : "Reading…"}
        </Badge>
        <div className="pt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Droplets className="h-3 w-3" />
          <span>
            Last irrigated:{" "}
            <span className="text-foreground">
              {lastIrrigationAt ? formatRelative(lastIrrigationAt) : "—"}
            </span>
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Updated {new Date(lastUpdate).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};
