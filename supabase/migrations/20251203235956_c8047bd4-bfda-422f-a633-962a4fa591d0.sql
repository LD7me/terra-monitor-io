-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow sensor inserts with valid user_id" ON public.sensor_readings;

-- Create a security definer function to check if user exists
CREATE OR REPLACE FUNCTION public.user_exists(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = _user_id
  )
$$;

-- Create new policy using the function
CREATE POLICY "Allow sensor inserts with valid user_id" 
ON public.sensor_readings
FOR INSERT
WITH CHECK (
  user_id IS NOT NULL 
  AND public.user_exists(user_id)
);