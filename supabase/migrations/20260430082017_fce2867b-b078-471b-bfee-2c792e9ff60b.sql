
ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS lux numeric,
  ADD COLUMN IF NOT EXISTS ppfd numeric,
  ADD COLUMN IF NOT EXISTS dli numeric,
  ADD COLUMN IF NOT EXISTS is_day boolean;

ALTER TABLE public.alert_configurations
  ADD COLUMN IF NOT EXISTS dli_threshold numeric NOT NULL DEFAULT 12;
