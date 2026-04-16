-- Add light_intensity column to sensor_readings
ALTER TABLE public.sensor_readings
ADD COLUMN light_intensity numeric NULL;

-- Add light thresholds to alert_configurations
ALTER TABLE public.alert_configurations
ADD COLUMN light_min numeric NULL DEFAULT 200,
ADD COLUMN light_max numeric NULL DEFAULT 800;
