import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeviceState {
  irrigationActive: boolean;
  fanActive: boolean;
  irrigationPending: boolean;
  fanPending: boolean;
}

export function useDeviceControl(sensorData: { soilMoisture: string; temperature: number }) {
  const { user } = useAuth();
  const [state, setState] = useState<DeviceState>({
    irrigationActive: false,
    fanActive: false,
    irrigationPending: false,
    fanPending: false,
  });
  const [sendingCommand, setSendingCommand] = useState<'irrigation' | 'fan' | null>(null);

  // Fetch current device states from latest executed commands
  useEffect(() => {
    if (!user?.id) return;

    const fetchDeviceStates = async () => {
      // Get latest executed command for each device
      const { data: commands } = await supabase
        .from('device_commands')
        .select('device, action, status')
        .eq('user_id', user.id)
        .in('device', ['irrigation', 'fan'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (commands) {
        const latestIrrigation = commands.find(c => c.device === 'irrigation' && c.status === 'executed');
        const latestFan = commands.find(c => c.device === 'fan' && c.status === 'executed');
        const pendingIrrigation = commands.some(c => c.device === 'irrigation' && c.status === 'pending');
        const pendingFan = commands.some(c => c.device === 'fan' && c.status === 'pending');

        setState({
          irrigationActive: latestIrrigation?.action === 'on',
          fanActive: latestFan?.action === 'on',
          irrigationPending: pendingIrrigation,
          fanPending: pendingFan,
        });
      }
    };

    fetchDeviceStates();

    // Subscribe to command updates
    const channel = supabase
      .channel('device_commands_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_commands',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const cmd = payload.new as any;
          if (cmd.status === 'executed') {
            toast.success(`${cmd.device} ${cmd.action.toUpperCase()} executed`, {
              description: "Pi confirmed command execution"
            });
          }
          fetchDeviceStates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const sendCommand = useCallback(async (device: 'irrigation' | 'fan', action: 'on' | 'off') => {
    if (!user?.id) {
      toast.error("You must be logged in to control devices");
      return;
    }

    setSendingCommand(device);
    try {
      const { error } = await supabase.from('device_commands').insert({
        user_id: user.id,
        device,
        action,
        status: 'pending'
      });

      if (error) throw error;

      // Log irrigation actions
      if (device === 'irrigation') {
        await supabase.from('irrigation_logs').insert({
          user_id: user.id,
          action,
          trigger_type: 'manual',
          soil_moisture: sensorData.soilMoisture,
          temperature: sensorData.temperature,
          reason: 'Manual cloud control',
        });
      }

      toast.success(`Command queued: ${device} ${action.toUpperCase()}`, {
        description: "Waiting for Pi to execute..."
      });

      // Update pending state
      setState(prev => ({
        ...prev,
        [`${device}Pending`]: true,
      }));
    } catch (error) {
      console.error('Failed to send command:', error);
      toast.error("Failed to send command");
    } finally {
      setSendingCommand(null);
    }
  }, [user?.id, sensorData]);

  const toggleIrrigation = useCallback(() => {
    const action = state.irrigationActive ? 'off' : 'on';
    sendCommand('irrigation', action);
  }, [state.irrigationActive, sendCommand]);

  const toggleFan = useCallback(() => {
    const action = state.fanActive ? 'off' : 'on';
    sendCommand('fan', action);
  }, [state.fanActive, sendCommand]);

  return {
    ...state,
    sendingCommand,
    toggleIrrigation,
    toggleFan,
  };
}
