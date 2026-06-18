# Supabase Storage Setup

Go to Supabase Dashboard → Storage → New bucket:

1. **documents** — Private
   - RLS: SELECT for owner (auth.uid() matches user_id in path)
   - RLS: INSERT for authenticated users

2. **user-avatars** — Public
   - RLS: INSERT/UPDATE: auth.uid()::text = (storage.foldername(name))[1]
   - SELECT: public (no restriction)
