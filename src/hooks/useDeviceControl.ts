import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Device = 'irrigation' | 'fan' | 'grow_light';

interface DeviceState {
  irrigationActive: boolean;
  fanActive: boolean;
  growLightActive: boolean;
  irrigationPending: boolean;
  fanPending: boolean;
  growLightPending: boolean;
}

export function useDeviceControl(sensorData: { soilMoisture: string; temperature: number }) {
  const { user } = useAuth();
  const [state, setState] = useState<DeviceState>({
    irrigationActive: false,
    fanActive: false,
    growLightActive: false,
    irrigationPending: false,
    fanPending: false,
    growLightPending: false,
  });
  const [sendingCommand, setSendingCommand] = useState<Device | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDeviceStates = async () => {
      const { data: commands } = await supabase
        .from('device_commands')
        .select('device, action, status')
        .eq('user_id', user.id)
        .in('device', ['irrigation', 'fan', 'grow_light'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (commands) {
        const latestIrrigation = commands.find(c => c.device === 'irrigation' && c.status === 'executed');
        const latestFan = commands.find(c => c.device === 'fan' && c.status === 'executed');
        const latestGrowLight = commands.find(c => c.device === 'grow_light' && c.status === 'executed');

        setState({
          irrigationActive: latestIrrigation?.action === 'on',
          fanActive: latestFan?.action === 'on',
          growLightActive: latestGrowLight?.action === 'on',
          irrigationPending: commands.some(c => c.device === 'irrigation' && c.status === 'pending'),
          fanPending: commands.some(c => c.device === 'fan' && c.status === 'pending'),
          growLightPending: commands.some(c => c.device === 'grow_light' && c.status === 'pending'),
        });
      }
    };

    fetchDeviceStates();

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
          if (cmd?.status === 'executed') {
            toast.success(`${cmd.device} ${String(cmd.action).toUpperCase()} executed`, {
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

  const sendCommand = useCallback(async (device: Device, action: 'on' | 'off') => {
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

      setState(prev => ({
        ...prev,
        [`${device === 'grow_light' ? 'growLight' : device}Pending`]: true,
      }));
    } catch (error) {
      console.error('Failed to send command:', error);
      toast.error("Failed to send command");
    } finally {
      setSendingCommand(null);
    }
  }, [user?.id, sensorData]);

  const toggleIrrigation = useCallback(() => {
    sendCommand('irrigation', state.irrigationActive ? 'off' : 'on');
  }, [state.irrigationActive, sendCommand]);

  const toggleFan = useCallback(() => {
    sendCommand('fan', state.fanActive ? 'off' : 'on');
  }, [state.fanActive, sendCommand]);

  const toggleGrowLight = useCallback(() => {
    sendCommand('grow_light', state.growLightActive ? 'off' : 'on');
  }, [state.growLightActive, sendCommand]);

  return {
    ...state,
    sendingCommand,
    toggleIrrigation,
    toggleFan,
    toggleGrowLight,
  };
}
