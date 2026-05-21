import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { fetchSettings, saveSettings, type AutomationSettings } from "@/lib/api";
import { SystemConfig } from "@/components/SystemConfig";


const FIELDS: Array<{
  key: keyof AutomationSettings;
  label: string;
  hint: string;
  step: string;
}> = [
  { key: "TEMP_ON", label: "Fan ON temperature (°C)", hint: "Fan turns on above this", step: "0.5" },
  { key: "TEMP_OFF", label: "Fan OFF temperature (°C)", hint: "Fan turns off below this", step: "0.5" },
  { key: "DLI_THRESHOLD", label: "Target daily light integral (mol/m²/d)", hint: "Grow light supplements if daytime DLI is below this", step: "0.1" },
  { key: "SOIL_DRY_ADC_ON", label: "Soil ADC: DRY threshold (pump ON)", hint: "Reading below this = dry, pump turns on", step: "1" },
  { key: "SOIL_WET_ADC_OFF", label: "Soil ADC: WET threshold (pump OFF)", hint: "Reading above this = wet, pump turns off", step: "1" },
];

const Settings = () => {
  const [values, setValues] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setValues(await fetchSettings());
    } catch {
      toast.error("Could not reach Pi. Check the connection on the Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (k: keyof AutomationSettings, v: string) => {
    if (!values) return;
    setValues({ ...values, [k]: v === "" ? 0 : Number(v) });
  };

  const onSave = async () => {
    if (!values) return;
    setSaving(true);
    try {
      const fresh = await saveSettings(values);
      setValues(fresh);
      toast.success("Setpoints saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="container mx-auto max-w-2xl space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-1">Settings</h1>
            <p className="text-muted-foreground text-[11px] sm:text-sm">
              Adjust the automation thresholds the Pi uses to decide when to run devices.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Automation thresholds</CardTitle>
              <CardDescription>Stored on the Pi. Takes effect immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading || !values ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> loading…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FIELDS.map((f) => (
                      <div key={f.key} className="space-y-1">
                        <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
                        <Input
                          id={f.key}
                          type="number"
                          step={f.step}
                          value={values[f.key]}
                          onChange={(e) => onChange(f.key, e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={onSave} disabled={saving} size="sm" className="gap-1">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </Button>
                    <Button onClick={load} variant="outline" size="sm" disabled={saving}>
                      Reload
                    </Button>
                  </div>
                </>
              )}
            <SystemConfig />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
