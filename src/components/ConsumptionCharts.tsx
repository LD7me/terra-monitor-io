import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Zap, Droplets } from 'lucide-react';
import { useConsumption } from '@/hooks/useConsumption';

const fmtDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
};

export function ConsumptionCharts() {
  const { data, error } = useConsumption(7);

  const rows = (data?.daily ?? []).map((d) => ({
    date: fmtDate(d.date),
    pump_wh: +(d.by_device.irrigation?.wh ?? 0).toFixed(2),
    fan_wh: +(d.by_device.fan?.wh ?? 0).toFixed(2),
    light_wh: +(d.by_device.grow_light?.wh ?? 0).toFixed(2),
    total_wh: d.power_wh,
    water_l: +(d.water_ml / 1000).toFixed(2),
  }));

  const totalWh = rows.reduce((s, r) => s + r.total_wh, 0);
  const totalL = rows.reduce((s, r) => s + r.water_l, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-4 w-4 text-primary" /> Power consumption
              </CardTitle>
              <CardDescription className="text-xs">
                Daily Wh per device · last 7 days · pump 5W · fan 15W · light 5W
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalWh.toFixed(1)} Wh</div>
              <div className="text-[10px] text-muted-foreground">7-day total</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-xs text-destructive">Pi unreachable</p>}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" Wh" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pump_wh" stackId="p" name="Pump" fill="hsl(var(--primary))" />
                <Bar dataKey="fan_wh" stackId="p" name="Fan" fill="hsl(var(--secondary))" />
                <Bar dataKey="light_wh" stackId="p" name="Light" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Droplets className="h-4 w-4 text-secondary" /> Water consumption
              </CardTitle>
              <CardDescription className="text-xs">
                Daily liters · last 7 days · pump flow ≈ 60 mL/s
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalL.toFixed(2)} L</div>
              <div className="text-[10px] text-muted-foreground">7-day total</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-xs text-destructive">Pi unreachable</p>}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" L" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="water_l" name="Water" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
