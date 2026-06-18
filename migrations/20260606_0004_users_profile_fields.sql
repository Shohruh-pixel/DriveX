ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cars jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_car_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS maintenance_data jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fcm_token text DEFAULT '';
