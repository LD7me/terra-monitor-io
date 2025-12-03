import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CheckCircle, Info } from "lucide-react";

export const SystemConfig = () => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Cloud Data Sync
        </CardTitle>
        <CardDescription>
          Sensor data is synced from your Raspberry Pi to the cloud
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500">Cloud sync enabled</span>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Your Raspberry Pi sends sensor data directly to the cloud database every 5 seconds.
              The dashboard receives real-time updates automatically.
            </p>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <p className="font-medium text-foreground">Pi Setup Required:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Install Python packages: <code className="bg-background px-1 rounded">pip install requests adafruit-circuitpython-dht</code></li>
              <li>Configure your Pi script with your <code className="bg-background px-1 rounded">USER_ID</code> from your account</li>
              <li>Run: <code className="bg-background px-1 rounded">python3 app.py</code></li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
