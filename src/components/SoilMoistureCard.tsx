import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sprout, Droplets, AlertTriangle } from "lucide-react";

interface SoilMoistureCardProps {
  soilMoisture: string;
  soilMoisturePercentage: number | null;
  lastUpdate: string;
  thresholds: {
    min: number;
    max: number;
  };
}

export const SoilMoistureCard = ({ 
  soilMoisture, 
  soilMoisturePercentage,
  lastUpdate,
  thresholds
}: SoilMoistureCardProps) => {
  
  const getIrrigationRecommendation = () => {
    if (soilMoisturePercentage === null) {
      // Fallback to text-based moisture
      if (soilMoisture === "Dry") {
        return { 
          text: "Water Now", 
          subtext: "Moisture below threshold",
          variant: "destructive" as const,
          icon: AlertTriangle 
        };
      }
      return { 
        text: "No Irrigation Needed", 
        subtext: "Soil moisture adequate",
        variant: "default" as const,
        icon: Droplets 
      };
    }

    if (soilMoisturePercentage < thresholds.min) {
      return { 
        text: "Water Now", 
        subtext: `Moisture ${soilMoisturePercentage}% below ${thresholds.min}% threshold`,
        variant: "destructive" as const,
        icon: AlertTriangle 
      };
    }
    if (soilMoisturePercentage > thresholds.max) {
      return { 
        text: "Pause Irrigation", 
        subtext: `Soil too wet (${soilMoisturePercentage}% > ${thresholds.max}%)`,
        variant: "secondary" as const,
        icon: Droplets 
      };
    }
    return { 
      text: "No Irrigation Needed", 
      subtext: `Optimal range (${thresholds.min}-${thresholds.max}%)`,
      variant: "default" as const,
      icon: Droplets 
    };
  };

  const recommendation = getIrrigationRecommendation();
  const RecommendationIcon = recommendation.icon;

  const getMoistureColor = () => {
    if (soilMoisturePercentage === null) {
      return soilMoisture === "Wet" ? "text-primary" : "text-destructive";
    }
    if (soilMoisturePercentage < thresholds.min) return "text-destructive";
    if (soilMoisturePercentage > thresholds.max) return "text-secondary";
    return "text-primary";
  };

  const displayPercentage = soilMoisturePercentage ?? (soilMoisture === "Wet" ? 60 : 20);

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Soil Moisture</CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </div>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Last reading: {new Date(lastUpdate).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Display */}
        <div className="flex items-end gap-2">
          <div className={`text-3xl sm:text-4xl font-bold ${getMoistureColor()}`}>
            {soilMoisturePercentage !== null ? `${soilMoisturePercentage}%` : soilMoisture}
          </div>
          {soilMoisturePercentage !== null && (
            <span className="text-sm text-muted-foreground mb-1">({soilMoisture})</span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress value={displayPercentage} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Dry (0%)</span>
            <span>Optimal ({thresholds.min}-{thresholds.max}%)</span>
            <span>Wet (100%)</span>
          </div>
        </div>

        {/* Irrigation Recommendation */}
        <div className={`p-3 rounded-lg border-2 ${
          recommendation.variant === "destructive" 
            ? "bg-destructive/10 border-destructive/30" 
            : recommendation.variant === "secondary"
            ? "bg-secondary/10 border-secondary/30"
            : "bg-primary/10 border-primary/30"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <RecommendationIcon className={`h-4 w-4 ${
              recommendation.variant === "destructive" 
                ? "text-destructive" 
                : recommendation.variant === "secondary"
                ? "text-secondary"
                : "text-primary"
            }`} />
            <span className="font-semibold text-sm">{recommendation.text}</span>
          </div>
          <p className="text-xs text-muted-foreground">{recommendation.subtext}</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
          <Badge variant={soilMoisture === "Wet" ? "default" : "destructive"}>
            {soilMoisture === "Wet" ? "Healthy" : "Needs Water"}
          </Badge>
          <span className="text-muted-foreground">Auto-irrigation ready</span>
        </div>
      </CardContent>
    </Card>
  );
};