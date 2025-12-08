import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Fan, Power, Cloud, Loader2 } from "lucide-react";
import { useDeviceControl } from "@/hooks/useDeviceControl";

interface DeviceControlPanelProps {
  sensorData: {
    soilMoisture: string;
    temperature: number;
  };
}

export function DeviceControlPanel({ sensorData }: DeviceControlPanelProps) {
  const {
    irrigationActive,
    fanActive,
    irrigationPending,
    fanPending,
    sendingCommand,
    toggleIrrigation,
    toggleFan,
  } = useDeviceControl(sensorData);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device Control Panel</CardTitle>
            <CardDescription>
              Control irrigation and ventilation via cloud commands
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Cloud className="h-3 w-3" />
            Cloud Control
          </Badge>
        </div>
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
              <div className="flex flex-col items-end gap-1">
                <Badge variant={irrigationActive ? "default" : "secondary"}>
                  {irrigationActive ? "Active" : "Inactive"}
                </Badge>
                {irrigationPending && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={toggleIrrigation}
              variant={irrigationActive ? "destructive" : "default"}
              className="w-full gap-2"
              disabled={sendingCommand === 'irrigation' || irrigationPending}
            >
              {sendingCommand === 'irrigation' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {sendingCommand === 'irrigation' ? "Sending..." : irrigationActive ? "Turn OFF" : "Turn ON"}
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
              <div className="flex flex-col items-end gap-1">
                <Badge variant={fanActive ? "default" : "secondary"}>
                  {fanActive ? "Running" : "Stopped"}
                </Badge>
                {fanPending && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={toggleFan}
              variant={fanActive ? "destructive" : "secondary"}
              className="w-full gap-2"
              disabled={sendingCommand === 'fan' || fanPending}
            >
              {sendingCommand === 'fan' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {sendingCommand === 'fan' ? "Sending..." : fanActive ? "Turn OFF" : "Turn ON"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
