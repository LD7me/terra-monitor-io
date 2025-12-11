import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlertThresholds {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  soilMoistureMin: number;
  soilMoistureMax: number;
  batteryLowThreshold: number;
  sensorOfflineMinutes: number;
  emailAlerts: boolean;
  emailAddress: string;
}

interface AlertConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thresholds: AlertThresholds;
  onSave: (thresholds: AlertThresholds) => void;
}

export const AlertConfigDialog = ({ 
  open, 
  onOpenChange, 
  thresholds, 
  onSave 
}: AlertConfigDialogProps) => {
  const [localThresholds, setLocalThresholds] = useState(thresholds);

  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  const handleSave = () => {
    onSave(localThresholds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alert Configuration</DialogTitle>
          <DialogDescription>
            Set thresholds for environmental alerts and notifications
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="environment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="environment" className="text-xs">Environment</TabsTrigger>
            <TabsTrigger value="device" className="text-xs">Device</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">Notify</TabsTrigger>
          </TabsList>

          <TabsContent value="environment" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Temp Min (°C)</Label>
                <Input
                  type="number"
                  value={localThresholds.tempMin}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, tempMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Temp Max (°C)</Label>
                <Input
                  type="number"
                  value={localThresholds.tempMax}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, tempMax: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Humidity Min (%)</Label>
                <Input
                  type="number"
                  value={localThresholds.humidityMin}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, humidityMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Humidity Max (%)</Label>
                <Input
                  type="number"
                  value={localThresholds.humidityMax}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, humidityMax: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Soil Moisture Min (%)</Label>
                <Input
                  type="number"
                  value={localThresholds.soilMoistureMin}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, soilMoistureMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Soil Moisture Max (%)</Label>
                <Input
                  type="number"
                  value={localThresholds.soilMoistureMax}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, soilMoistureMax: Number(e.target.value) })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="device" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Battery Low Alert (%)</Label>
                <Input
                  type="number"
                  value={localThresholds.batteryLowThreshold}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, batteryLowThreshold: Number(e.target.value) })}
                />
                <p className="text-[10px] text-muted-foreground">Alert when battery drops below this level</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sensor Offline (minutes)</Label>
                <Input
                  type="number"
                  value={localThresholds.sensorOfflineMinutes}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, sensorOfflineMinutes: Number(e.target.value) })}
                />
                <p className="text-[10px] text-muted-foreground">Alert after no data for this many minutes</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm">Email Alerts</Label>
                <p className="text-[10px] text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch
                checked={localThresholds.emailAlerts}
                onCheckedChange={(checked) => setLocalThresholds({ ...localThresholds, emailAlerts: checked })}
              />
            </div>
            {localThresholds.emailAlerts && (
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={localThresholds.emailAddress}
                  onChange={(e) => setLocalThresholds({ ...localThresholds, emailAddress: e.target.value })}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} className="w-full mt-4">
          Save Configuration
        </Button>
      </DialogContent>
    </Dialog>
  );
};