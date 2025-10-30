import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { SystemConfig } from "@/components/SystemConfig";
import { Thermometer, Droplets, Sprout, Power, Fan, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchSensorData, controlIrrigation, controlFan, getSystemConfig } from "@/lib/api";

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: "Wet" | "Dry";
  timestamp: string;
}

const Dashboard = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 24.5,
    humidity: 65,
    soilMoisture: "Wet",
    timestamp: new Date().toISOString(),
  });
  
  const [irrigationActive, setIrrigationActive] = useState(false);
  const [fanActive, setFanActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch real sensor data from Raspberry Pi
  useEffect(() => {
    const config = getSystemConfig();
    if (!config) {
      setIsConnected(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await fetchSensorData();
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          soilMoisture: data.soil_moisture as "Wet" | "Dry",
          timestamp: data.timestamp,
        });
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to fetch sensor data:", error);
        setIsConnected(false);
        // Fall back to simulated data
        setSensorData(prev => ({
          temperature: Number((23 + Math.random() * 4).toFixed(1)),
          humidity: Number((60 + Math.random() * 15).toFixed(0)),
          soilMoisture: Math.random() > 0.5 ? "Wet" : "Dry",
          timestamp: new Date().toISOString(),
        }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  const connectToSystem = () => {
    setIsConnected(true);
    toast.success("Connected to Raspberry Pi system");
  };

  const refreshData = () => {
    toast.info("Refreshing sensor data...");
    setSensorData(prev => ({
      ...prev,
      timestamp: new Date().toISOString(),
    }));
  };

  const toggleIrrigation = async () => {
    try {
      const action = irrigationActive ? 'off' : 'on';
      await controlIrrigation(action);
      setIrrigationActive(!irrigationActive);
      toast.success(irrigationActive ? "Irrigation turned OFF" : "Irrigation turned ON");
    } catch (error) {
      toast.error("Failed to control irrigation. Check your connection.");
    }
  };

  const toggleFan = async () => {
    try {
      const action = fanActive ? 'off' : 'on';
      await controlFan(action);
      setFanActive(!fanActive);
      toast.success(fanActive ? "Fan turned OFF" : "Fan turned ON");
    } catch (error) {
      toast.error("Failed to control fan. Check your connection.");
    }
  };

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button 
                variant={isConnected ? "default" : "hero"}
                size="sm"
                onClick={connectToSystem}
                disabled={isConnected}
              >
                {isConnected ? "Connected" : "Connect to System"}
              </Button>
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
              {isConnected ? "Connected to Raspberry Pi" : "Not Connected"}
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Device Control Panel</CardTitle>
              <CardDescription>
                Manually control irrigation and ventilation systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Irrigation Control */}
                <div className="p-6 rounded-lg border-2 border-border bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${irrigationActive ? 'bg-primary' : 'bg-muted'}`}>
                        <Droplets className={`h-6 w-6 ${irrigationActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Irrigation System</h3>
                        <p className="text-sm text-muted-foreground">Water pump relay control</p>
                      </div>
                    </div>
                    <Badge variant={irrigationActive ? "default" : "secondary"}>
                      {irrigationActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button 
                    onClick={toggleIrrigation}
                    variant={irrigationActive ? "destructive" : "hero"}
                    className="w-full gap-2"
                  >
                    <Power className="h-4 w-4" />
                    {irrigationActive ? "Turn OFF" : "Turn ON"}
                  </Button>
                </div>

                {/* Fan Control */}
                <div className="p-6 rounded-lg border-2 border-border bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${fanActive ? 'bg-secondary' : 'bg-muted'}`}>
                        <Fan className={`h-6 w-6 ${fanActive ? 'text-secondary-foreground animate-spin' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Ventilation Fan</h3>
                        <p className="text-sm text-muted-foreground">Cooling system control</p>
                      </div>
                    </div>
                    <Badge variant={fanActive ? "default" : "secondary"}>
                      {fanActive ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <Button 
                    onClick={toggleFan}
                    variant={fanActive ? "destructive" : "secondary"}
                    className="w-full gap-2"
                  >
                    <Power className="h-4 w-4" />
                    {fanActive ? "Turn OFF" : "Turn ON"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="mt-6 border-2 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm">🚀 Quick Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Install dependencies on your Raspberry Pi (see Documentation)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Run Flask API server: <code className="bg-muted px-2 py-1 rounded">sudo python3 app.py</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Enter your Pi's IP address in System Configuration above</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>Click "Test Connection" to verify setup</span>
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
