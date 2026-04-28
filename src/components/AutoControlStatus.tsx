import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Droplets, Fan, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface AutoControlStatusProps {
  thresholds: {
    soilMoistureMin: number;
    soilMoistureMax: number;
    tempMax: number;
    humidityMax: number;
  };
}

interface AutoEvent {
  device: string;
  action: string;
  status: string;
  created_at: string;
}

export function AutoControlStatus({ thresholds }: AutoControlStatusProps) {
  const { user } = useAuth();
  const [lastIrrigation, setLastIrrigation] = useState<AutoEvent | null>(null);
  const [lastFan, setLastFan] = useState<AutoEvent | null>(null);
  const [lastAutoLog, setLastAutoLog] = useState<{ reason: string; timestamp: string } | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLatest = async () => {
      const { data: cmds } = await supabase
        .from('device_commands')
        .select('device, action, status, created_at')
        .eq('user_id', user.id)
        .in('device', ['irrigation', 'fan'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (cmds) {
        setLastIrrigation(cmds.find((c) => c.device === 'irrigation') ?? null);
        setLastFan(cmds.find((c) => c.device === 'fan') ?? null);
      }

      const { data: logs } = await supabase
        .from('irrigation_logs')
        .select('reason, timestamp')
        .eq('user_id', user.id)
        .eq('trigger_type', 'auto')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (logs && logs[0]) setLastAutoLog({ reason: logs[0].reason ?? '', timestamp: logs[0].timestamp });
    };

    fetchLatest();

    const channel = supabase
      .channel('auto_control_status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_commands', filter: `user_id=eq.${user.id}` },
        fetchLatest
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'irrigation_logs', filter: `user_id=eq.${user.id}` },
        fetchLatest
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const renderEvent = (label: string, icon: React.ReactNode, evt: AutoEvent | null) => (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {evt ? (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(evt.created_at), { addSuffix: true })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No commands yet</p>
          )}
        </div>
      </div>
      {evt ? (
        <div className="flex flex-col items-end gap-1">
          <Badge variant={evt.action === 'on' ? 'default' : 'secondary'} className="text-xs uppercase">
            {evt.action}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {evt.status}
          </Badge>
        </div>
      ) : (
        <Badge variant="outline" className="text-xs">idle</Badge>
      )}
    </div>
  );

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bot className="h-5 w-5 text-primary" />
            Auto-Control Status
          </CardTitle>
          <Badge variant="default" className="text-[10px]">ACTIVE</Badge>
        </div>
        <CardDescription className="text-xs">
          Pump &amp; fan switch automatically when sensors cross thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active thresholds */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-muted-foreground">Soil moisture</p>
            <p className="font-semibold">{thresholds.soilMoistureMin}% – {thresholds.soilMoistureMax}%</p>
          </div>
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-muted-foreground">Fan triggers</p>
            <p className="font-semibold">&gt;{thresholds.tempMax}°C / &gt;{thresholds.humidityMax}%</p>
          </div>
        </div>

        {/* Latest auto actions */}
        {renderEvent('Irrigation', <Droplets className="h-4 w-4 text-secondary" />, lastIrrigation)}
        {renderEvent('Fan', <Fan className="h-4 w-4 text-accent" />, lastFan)}

        {/* Last auto reason */}
        {lastAutoLog && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
            <Clock className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-medium">Last auto trigger</p>
              <p className="text-muted-foreground">{lastAutoLog.reason}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
