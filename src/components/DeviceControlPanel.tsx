import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Fan, Power, Cloud, Loader2, Lightbulb, DoorOpen } from "lucide-react";
import { useDeviceControl } from "@/hooks/useDeviceControl";
import type { SensorData } from "@/hooks/useSensorData";

interface DeviceControlPanelProps {
  sensorData: SensorData;
  refresh?: () => void; 
}

export function DeviceControlPanel({ sensorData }: DeviceControlPanelProps) {
  const {
    irrigationActive,
    fanActive,
    growLightActive,
    doorActive,           // Added Door State
    irrigationPending,
    fanPending,
    growLightPending,
    doorPending,          // Added Door Pending
    sendingCommand,
    toggleIrrigation,
    toggleFan,
    toggleGrowLight,
    toggleDoor,           // Added Door Toggle
  } = useDeviceControl(sensorData);

  type TileProps = {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    activeBg: string;
    iconActiveColor: string;
    active: boolean;
    pending: boolean;
    sending: boolean;
    activeLabel: string;
    onToggle: () => void;
    variantOff: 'default' | 'secondary';
    btnTextOn?: string;   
    btnTextOff?: string;  
  };

  const Tile = ({ title, subtitle, icon, activeBg, iconActiveColor, active, pending, sending, activeLabel, onToggle, variantOff, btnTextOn = "Turn OFF", btnTextOff = "Turn ON" }: TileProps) => (
    <div className="p-4 sm:p-6 rounded-lg border-2 border-border bg-card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center ${active ? activeBg : 'bg-muted'}`}>
            <span className={active ? iconActiveColor : 'text-muted-foreground'}>{icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={active ? "default" : "secondary"} className="text-[10px] sm:text-xs">
            {active ? activeLabel : "Off"}
          </Badge>
          {pending && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Loader2 className="h-2 w-2 sm:h-3 sm:w-3 animate-spin" />
              Pending
            </Badge>
          )}
        </div>
      </div>
      <Button
        onClick={onToggle}
        variant={active ? "destructive" : variantOff}
        className="w-full gap-2 text-xs sm:text-sm"
        size="sm"
        disabled={sending || pending}
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
        {sending ? "Sending..." : active ? btnTextOn : btnTextOff}
      </Button>
    </div>
  );

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device Control Panel</CardTitle>
            <CardDescription>
              Control pump, fan, grow light, and door via cloud commands
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Cloud className="h-3 w-3" />
            Cloud Control
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Updated grid from cols-3 to cols-2 / lg:cols-4 so 4 items fit perfectly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile
            title="Irrigation"
            subtitle="Pump · GPIO 18"
            icon={<Droplets className="h-5 w-5 sm:h-6 sm:w-6" />}
            activeBg="bg-primary"
            iconActiveColor="text-primary-foreground"
            active={irrigationActive}
            pending={irrigationPending}
            sending={sendingCommand === 'irrigation'}
            activeLabel="Active"
            onToggle={toggleIrrigation}
            variantOff="default"
          />
          <Tile
            title="Ventilation"
            subtitle="Fan · GPIO 23"
            icon={<Fan className={`h-5 w-5 sm:h-6 sm:w-6 ${fanActive ? 'animate-spin' : ''}`} />}
            activeBg="bg-secondary"
            iconActiveColor="text-secondary-foreground"
            active={fanActive}
            pending={fanPending}
            sending={sendingCommand === 'fan'}
            activeLabel="Running"
            onToggle={toggleFan}
            variantOff="secondary"
          />
          <Tile
            title="Grow Light"
            subtitle="Lamp · GPIO 24"
            icon={<Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />}
            activeBg="bg-accent"
            iconActiveColor="text-accent-foreground"
            active={growLightActive}
            pending={growLightPending}
            sending={sendingCommand === 'grow_light'}
            activeLabel="On"
            onToggle={toggleGrowLight}
            variantOff="default"
          />
          <Tile
            title="AWG Door"
            subtitle="Servo · GPIO 13"
            icon={<DoorOpen className="h-5 w-5 sm:h-6 sm:w-6" />}
            activeBg="bg-emerald-500" 
            iconActiveColor="text-white"
            active={doorActive}
            pending={doorPending}
            sending={sendingCommand === 'door'}
            activeLabel="Open"
            onToggle={toggleDoor}
            variantOff="default"
            btnTextOn="Close Door" 
            btnTextOff="Open Door"  
          />
        </div>
      </CardContent>
    </Card>
  );
}