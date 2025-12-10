-- Add battery monitoring columns to sensor_readings
ALTER TABLE public.sensor_readings
ADD COLUMN battery_percentage numeric DEFAULT NULL,
ADD COLUMN battery_voltage numeric DEFAULT NULL;