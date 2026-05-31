import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { controlDevice } from '@/lib/api';
import type { SensorData } from '@/hooks/useSensorData';

type Device = 'irrigation' | 'fan' | 'grow_light' | 'door';

export function useDeviceControl(sensorData: SensorData, refresh?: () => void) {
  const [sending, setSending] = useState<Device | null>(null);

  const send = useCallback(
    async (device: Device, action: 'on' | 'off') => {
      setSending(device);
      try {
        await controlDevice(device, action);
        toast.success(`${device} ${action.toUpperCase()}`);
        refresh?.();
      } catch (e) {
        toast.error(`Failed to control ${device}`);
        console.error(e);
      } finally {
        setSending(null);
      }
    },
    [refresh],
  );

  const irrigationActive = sensorData.devices.irrigation;
  const fanActive = sensorData.devices.fan;
  const growLightActive = sensorData.devices.grow_light;
  const doorActive = sensorData.devices.door;

  return {
    irrigationActive,
    fanActive,
    growLightActive,
    doorActive,
    irrigationPending: false,
    fanPending: false,
    growLightPending: false,
    doorPending: false,
    sendingCommand: sending,
    toggleIrrigation: () => send('irrigation', irrigationActive ? 'off' : 'on'),
    toggleFan: () => send('fan', fanActive ? 'off' : 'on'),
    toggleGrowLight: () => send('grow_light', growLightActive ? 'off' : 'on'),
    toggleDoor:  () => send('door', doorActive ? 'off' : 'on')
  };
}
