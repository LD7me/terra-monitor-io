
-- Fix 1: Remove permissive sensor_readings insert policy that allows unauthenticated inserts
DROP POLICY IF EXISTS "Allow sensor inserts with valid user_id" ON sensor_readings;

-- Fix 2: Remove overly permissive device_commands policies
DROP POLICY IF EXISTS "Allow reading pending commands with valid user_id" ON device_commands;
DROP POLICY IF EXISTS "Allow updating commands with valid user_id" ON device_commands;
