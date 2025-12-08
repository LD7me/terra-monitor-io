import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Droplets, Fan, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Command {
  id: string;
  device: string;
  action: string;
  status: string;
  created_at: string;
  executed_at: string | null;
}

export const CommandHistory = () => {
  const { user } = useAuth();
  const [commands, setCommands] = useState<Command[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchCommands = async () => {
      const { data, error } = await supabase
        .from('device_commands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && !error) {
        setCommands(data);
      }
    };

    fetchCommands();

    // Real-time updates
    const channel = supabase
      .channel('command_history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_commands',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCommands()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-accent animate-pulse" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    return device === 'irrigation' 
      ? <Droplets className="h-4 w-4 text-secondary" />
      : <Fan className="h-4 w-4 text-primary" />;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Command History</CardTitle>
        </div>
        <CardDescription>Recent device control commands</CardDescription>
      </CardHeader>
      <CardContent>
        {commands.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No commands sent yet
          </p>
        ) : (
          <div className="space-y-3">
            {commands.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(cmd.device)}
                  <div>
                    <p className="font-medium capitalize text-sm">
                      {cmd.device} - {cmd.action.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(cmd.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(cmd.status)}
                  <Badge variant={cmd.status === 'executed' ? 'default' : 'secondary'}>
                    {cmd.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
