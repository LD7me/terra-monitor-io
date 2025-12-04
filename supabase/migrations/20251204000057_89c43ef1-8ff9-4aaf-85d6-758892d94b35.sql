-- Create device_commands table for remote control
CREATE TABLE public.device_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device text NOT NULL, -- 'irrigation' or 'fan'
  action text NOT NULL, -- 'on' or 'off'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'executed', 'failed'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  executed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;

-- Users can view their own commands
CREATE POLICY "Users can view their own commands"
ON public.device_commands
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own commands
CREATE POLICY "Users can insert their own commands"
ON public.device_commands
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow Pi to read pending commands (using security definer function)
CREATE POLICY "Allow reading pending commands with valid user_id"
ON public.device_commands
FOR SELECT
USING (public.user_exists(user_id));

-- Allow Pi to update command status
CREATE POLICY "Allow updating commands with valid user_id"
ON public.device_commands
FOR UPDATE
USING (public.user_exists(user_id));

-- Enable realtime for commands
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_commands;