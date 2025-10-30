import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSystemConfig, saveSystemConfig, testConnection } from "@/lib/api";
import { Settings, Wifi, WifiOff } from "lucide-react";

export const SystemConfig = () => {
  const [piAddress, setPiAddress] = useState("");
  const [apiPort, setApiPort] = useState("5000");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const config = getSystemConfig();
    if (config) {
      setPiAddress(config.piAddress);
      setApiPort(config.apiPort);
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    setIsTesting(true);
    const connected = await testConnection();
    setIsConnected(connected);
    setIsTesting(false);
  };

  const handleSave = () => {
    if (!piAddress) {
      toast({
        title: "Error",
        description: "Please enter your Raspberry Pi IP address",
        variant: "destructive",
      });
      return;
    }

    saveSystemConfig({ piAddress, apiPort });
    toast({
      title: "Configuration Saved",
      description: "System configuration has been saved successfully",
    });
    checkConnection();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Configuration
        </CardTitle>
        <CardDescription>
          Configure connection to your Raspberry Pi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="piAddress">Raspberry Pi IP Address</Label>
          <Input
            id="piAddress"
            placeholder="e.g., 192.168.1.100"
            value={piAddress}
            onChange={(e) => setPiAddress(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Find your Pi's IP by running: <code className="bg-muted px-1 rounded">hostname -I</code>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiPort">API Port</Label>
          <Input
            id="apiPort"
            placeholder="5000"
            value={apiPort}
            onChange={(e) => setApiPort(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            Save Configuration
          </Button>
          <Button 
            variant="outline" 
            onClick={checkConnection}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${isConnected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">Connected to Raspberry Pi</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">Not connected</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
