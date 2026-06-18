-- Пользовательские настройки приложения (push, гео, язык и т.д.)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
