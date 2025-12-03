-- Allow sensor inserts with valid user_id (for Raspberry Pi uploads)
CREATE POLICY "Allow sensor inserts with valid user_id" 
ON public.sensor_readings
FOR INSERT
WITH CHECK (
  user_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  )
);