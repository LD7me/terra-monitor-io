import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cloud, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getSystemConfig, saveSystemConfig, testConnection } from '@/lib/api';
import { toast } from 'sonner';

export const SystemConfig = () => {
  const initial = getSystemConfig();
  const [piAddress, setPiAddress] = useState(initial.piAddress);
  const [apiPort, setApiPort] = useState(initial.apiPort);
  const [status, setStatus] = useState<'unknown' | 'ok' | 'fail' | 'checking'>('unknown');

  const check = async () => {
    setStatus('checking');
    setStatus((await testConnection()) ? 'ok' : 'fail');
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = () => {
    saveSystemConfig({ piAddress: piAddress.trim(), apiPort: apiPort.trim() });
    toast.success('Saved Pi address');
    check();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" /> Raspberry Pi connection
        </CardTitle>
        <CardDescription>
          Dashboard talks directly to the Pi over your local network. All data is stored on the Pi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="pi-addr" className="text-xs">Pi address (IP or hostname)</Label>
            <Input id="pi-addr" value={piAddress} onChange={(e) => setPiAddress(e.target.value)} placeholder="192.168.1.50" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pi-port" className="text-xs">Port</Label>
            <Input id="pi-port" value={apiPort} onChange={(e) => setApiPort(e.target.value)} placeholder="5000" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onSave} size="sm">Save & test</Button>
          <Button onClick={check} variant="outline" size="sm">Test connection</Button>
          {status === 'checking' && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> checking…
            </span>
          )}
          {status === 'ok' && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="h-3 w-3" /> connected
            </span>
          )}
          {status === 'fail' && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3 w-3" /> cannot reach Pi
            </span>
          )}
        </div>

        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">On the Pi:</p>
          <code className="block bg-background px-2 py-1 rounded">
            cd ~/raspberry-pi && source venv/bin/activate
          </code>
          <code className="block bg-background px-2 py-1 rounded">
            pip install flask flask-cors pyserial RPi.GPIO
          </code>
          <code className="block bg-background px-2 py-1 rounded">python3 app.py</code>
          <p className="pt-1">Find the Pi IP with <code className="bg-background px-1 rounded">hostname -I</code></p>
        </div>
      </CardContent>
    </Card>
  );
};
