import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Droplets, Fan, Lightbulb } from 'lucide-react';
import { fetchEvents, type DeviceEvent } from '@/lib/api';

const deviceIcon: Record<string, JSX.Element> = {
  irrigation: <Droplets className="h-3.5 w-3.5" />,
  fan: <Fan className="h-3.5 w-3.5" />,
  grow_light: <Lightbulb className="h-3.5 w-3.5" />,
};

const prettyDevice: Record<string, string> = {
  irrigation: 'Pump',
  fan: 'Fan',
  grow_light: 'Grow light',
};

const formatReason = (reason: string | null) => {
  if (!reason) return 'auto';
  // backend conventions: "manual", "auto:soil_dry", "auto:temp_high", "auto:dli_low", "auto:timer_done"
  if (reason === 'manual') return 'manual override';
  if (reason.startsWith('auto:')) {
    const code = reason.slice(5);
    const map: Record<string, string> = {
      soil_dry: 'soil below threshold',
      soil_wet: 'soil above threshold',
      temp_high: 'temperature above limit',
      temp_low: 'temperature back in range',
      dli_low: 'DLI below threshold (sunset)',
      timer_done: 'grow-light timer complete',
      pump_priority: 'paused for pump',
    };
    return `auto · ${map[code] ?? code}`;
  }
  return reason;
};

export function ActivityLog() {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const e = await fetchEvents(50);
        if (!cancelled) {
          setEvents(e);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'failed');
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="h-4 w-4 text-primary" /> Activity log
        </CardTitle>
        <CardDescription className="text-xs">
          Recent device events · why each action happened
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-xs text-destructive mb-2">Pi unreachable</p>}
        {events.length === 0 && !error && (
          <p className="text-xs text-muted-foreground">No events yet.</p>
        )}
        <ScrollArea className="h-64 sm:h-72 pr-2">
          <ul className="space-y-1.5">
            {events.map((e, idx) => {
              const on = e.state === 1;
              const isManual = e.reason === 'manual';
              return (
                <li
                  key={`${e.ts}-${idx}`}
                  className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm py-1.5 border-b border-border/40 last:border-0"
                >
                  <div
                    className={`mt-0.5 h-6 w-6 sm:h-7 sm:w-7 rounded-md flex items-center justify-center shrink-0 ${
                      on ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {deviceIcon[e.device] ?? <Activity className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{prettyDevice[e.device] ?? e.device}</span>
                      <Badge
                        variant={on ? 'default' : 'secondary'}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {on ? 'ON' : 'OFF'}
                      </Badge>
                      {isManual && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          manual
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {formatReason(e.reason)}
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {new Date(e.ts).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
