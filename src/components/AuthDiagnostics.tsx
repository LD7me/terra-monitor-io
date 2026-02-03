import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ProbeResult = {
  ok: boolean;
  status?: number;
  contentType?: string | null;
  bodyPreview?: string;
  error?: string;
};

async function fetchTextWithMeta(url: string, init?: RequestInit): Promise<ProbeResult> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get("content-type");
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      contentType,
      bodyPreview: text.slice(0, 600),
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export default function AuthDiagnostics() {
  const [running, setRunning] = useState(false);
  const [health, setHealth] = useState<ProbeResult | null>(null);
  const [tokenProbe, setTokenProbe] = useState<ProbeResult | null>(null);

  const supabaseUrl = useMemo(() => {
    // Avoid hardcoding; use the configured runtime env var.
    // This is safe to show since it’s already public client config.
    return (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  }, []);

  const run = async () => {
    if (!supabaseUrl) {
      setHealth({ ok: false, error: "Missing VITE_SUPABASE_URL at runtime." });
      return;
    }

    setRunning(true);
    setHealth(null);
    setTokenProbe(null);

    // 1) Simple health probe (should return 200/204).
    const healthUrl = `${supabaseUrl}/auth/v1/health`;
    const healthRes = await fetchTextWithMeta(healthUrl, {
      method: "GET",
      headers: {
        apikey: (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    setHealth(healthRes);

    // 2) Token endpoint probe (intentionally invalid creds). We expect JSON error (400),
    // but NOT a network/CORS failure.
    const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    const tokenRes = await fetchTextWithMeta(tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ email: "probe@example.com", password: "invalid-password" }),
    });
    setTokenProbe(tokenRes);

    setRunning(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Auth diagnostics</CardTitle>
        <CardDescription>
          Runs two lightweight probes to tell whether the authentication API is reachable from this browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button type="button" variant="outline" onClick={run} disabled={running}>
          {running ? "Running…" : "Run diagnostics"}
        </Button>

        {(health || tokenProbe) && <Separator />}

        {health && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Health check</div>
            <pre className="text-xs whitespace-pre-wrap rounded-md bg-muted p-3 border border-border">
{JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}

        {tokenProbe && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Token endpoint probe</div>
            <pre className="text-xs whitespace-pre-wrap rounded-md bg-muted p-3 border border-border">
{JSON.stringify(tokenProbe, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
