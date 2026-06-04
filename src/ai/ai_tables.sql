-- ─────────────────────────────────────────────────────────────────────────────
--  DriveX AI — Таблицы истории чатов
--  Запусти это в Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Чаты (сессии диалога, одна в день по умолчанию)
CREATE TABLE IF NOT EXISTS ai_chats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  title         TEXT NOT NULL DEFAULT 'Новый чат',
  car_context   JSONB,          -- снимок авто на момент создания чата
  message_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_chats_user_id_idx ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS ai_chats_updated_at_idx ON ai_chats(updated_at DESC);

-- Сообщения в чатах
CREATE TABLE IF NOT EXISTS ai_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       UUID NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT,           -- текст сообщения
  response_json JSONB,          -- полный JSON ответа AI (для ассистента)
  scenario_type TEXT,           -- diagnostic / maintenance / find_service / etc
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_chat_id_idx  ON ai_messages(chat_id);
CREATE INDEX IF NOT EXISTS ai_messages_user_id_idx  ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS ai_messages_created_at_idx ON ai_messages(created_at);

-- Row Level Security (только свои чаты)
ALTER TABLE ai_chats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own chats"
  ON ai_chats FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_user);

CREATE POLICY "Users see own messages"
  ON ai_messages FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_user);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_ai_chat_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ai_chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_messages_update_chat_ts
  AFTER INSERT ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION update_ai_chat_timestamp();

-- Счётчик сообщений
CREATE OR REPLACE FUNCTION increment_chat_messages()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ai_chats
  SET message_count = message_count + 1
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_messages_count_trigger
  AFTER INSERT ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION increment_chat_messages();
