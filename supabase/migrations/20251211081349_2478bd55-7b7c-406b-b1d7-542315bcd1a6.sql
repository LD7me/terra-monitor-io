-- Add soil moisture percentage and wifi signal strength columns
ALTER TABLE public.sensor_readings 
ADD COLUMN IF NOT EXISTS soil_moisture_percentage numeric,
ADD COLUMN IF NOT EXISTS wifi_signal_strength integer;

-- Add soil moisture thresholds to alert_configurations
ALTER TABLE public.alert_configurations
ADD COLUMN IF NOT EXISTS soil_moisture_min numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS soil_moisture_max numeric DEFAULT 70,
ADD COLUMN IF NOT EXISTS battery_low_threshold numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS sensor_offline_minutes integer DEFAULT 10;