import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin } from "lucide-react";
import { toast } from "sonner";

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  windSpeed: number;
  location: string;
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("weather_api_key");
    const savedLocation = localStorage.getItem("weather_location");
    
    if (savedKey && savedLocation) {
      setApiKey(savedKey);
      setLocation(savedLocation);
      setIsConfigured(true);
      fetchWeather(savedLocation, savedKey);
    }
  }, []);

  const fetchWeather = async (loc: string, key: string) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${loc}&appid=${key}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data = await response.json();
      setWeather({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        windSpeed: data.wind.speed,
        location: data.name,
      });
    } catch (error) {
      toast.error("Failed to fetch weather data. Check your API key and location.");
    }
  };

  const saveConfig = () => {
    if (!apiKey || !location) {
      toast.error("Please enter both API key and location");
      return;
    }

    localStorage.setItem("weather_api_key", apiKey);
    localStorage.setItem("weather_location", location);
    setIsConfigured(true);
    fetchWeather(location, apiKey);
    toast.success("Weather configuration saved");
  };

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="h-8 w-8 text-muted-foreground" />;
    
    const desc = weather.description.toLowerCase();
    if (desc.includes("rain")) return <CloudRain className="h-8 w-8 text-secondary" />;
    if (desc.includes("cloud")) return <Cloud className="h-8 w-8 text-muted-foreground" />;
    return <Sun className="h-8 w-8 text-accent" />;
  };

  useEffect(() => {
    if (isConfigured && location && apiKey) {
      const interval = setInterval(() => {
        fetchWeather(location, apiKey);
      }, 600000); // Update every 10 minutes

      return () => clearInterval(interval);
    }
  }, [isConfigured, location, apiKey]);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <CardTitle>Local Weather</CardTitle>
        </div>
        <CardDescription>
          Real-time weather conditions for smart automation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConfigured ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location (City)</Label>
              <Input
                id="location"
                placeholder="e.g., London"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenWeather API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Get free key at openweathermap.org"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <Button onClick={saveConfig} className="w-full">
              Save & Fetch Weather
            </Button>
          </div>
        ) : weather ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getWeatherIcon()}
                <div>
                  <div className="text-3xl font-bold">{weather.temp}°C</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {weather.description}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex flex-col items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Location</span>
                <span className="text-sm font-medium">{weather.location}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Humidity</span>
                <span className="text-sm font-medium">{weather.humidity}%</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Wind</span>
                <span className="text-sm font-medium">{weather.windSpeed} m/s</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigured(false)}
              className="w-full"
            >
              Reconfigure
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            Loading weather data...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
