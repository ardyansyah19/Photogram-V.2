-- Jalankan file ini jika database kamu sudah dibuat dari schema.sql versi
-- sebelum modul Chat Sosial (belum ada tabel conversations & messages).

CREATE TABLE IF NOT EXISTS conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_two_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_one_id <> user_two_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_pair
    ON conversations (LEAST(user_one_id, user_two_id), GREATEST(user_one_id, user_two_id));

CREATE TABLE IF NOT EXISTS messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content          TEXT,
    media_url        VARCHAR(255),
    message_type     VARCHAR(10) NOT NULL DEFAULT 'text',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at          TIMESTAMPTZ,
    CHECK (message_type IN ('text', 'image')),
    CHECK (
        (message_type = 'text'  AND content IS NOT NULL) OR
        (message_type = 'image' AND media_url IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_one ON conversations(user_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_two ON conversations(user_two_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
