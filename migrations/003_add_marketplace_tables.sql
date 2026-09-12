-- Jalankan file ini jika database kamu sudah dibuat dari schema.sql versi
-- sebelum modul Marketplace ditambahkan.

CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_url   VARCHAR(255) NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS marketplace_conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (buyer_id <> seller_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_conversations_product_buyer
    ON marketplace_conversations (product_id, buyer_id);

CREATE TABLE IF NOT EXISTS marketplace_messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_products_seller_id       ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at      ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_mp_conversations_product ON marketplace_conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_mp_conversations_buyer   ON marketplace_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_conversations_seller  ON marketplace_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_messages_conversation ON marketplace_messages(conversation_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_mp_conversations_updated_at ON marketplace_conversations;
CREATE TRIGGER trg_mp_conversations_updated_at
    BEFORE UPDATE ON marketplace_conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
