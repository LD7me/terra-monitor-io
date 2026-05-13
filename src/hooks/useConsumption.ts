import { useEffect, useState } from 'react';
import { fetchConsumption, type ConsumptionResponse } from '@/lib/api';

export function useConsumption(days = 7, pollMs = 30000) {
  const [data, setData] = useState<ConsumptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetchConsumption(days);
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'failed');
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [days, pollMs]);

  return { data, error };
}
