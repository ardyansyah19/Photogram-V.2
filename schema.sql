-- ============================================================
-- SOCIAL MARKETPLACE - DATABASE SCHEMA
-- Tahap 1: Modul Feed (users dasar, posts, media, like, comment)
-- Database: PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- untuk gen_random_uuid()

-- ------------------------------------------------------------
-- USERS (versi dasar dulu, kolom marketplace/chat menyusul
-- saat modul terkait dikerjakan)
-- ------------------------------------------------------------
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(50) UNIQUE NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(100),
    bio            TEXT,
    profile_photo  VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- POSTS (feed)
-- ------------------------------------------------------------
CREATE TABLE posts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption      TEXT,
    views_count  INTEGER NOT NULL DEFAULT 0,
    is_edited    BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Setiap post bisa punya beberapa media (carousel), position
-- menentukan urutan tampil.
CREATE TABLE post_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url   VARCHAR(255) NOT NULL,
    media_type  VARCHAR(20) NOT NULL DEFAULT 'image',
    position    INTEGER NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- LIKE & COMMENT
-- ------------------------------------------------------------
CREATE TABLE post_likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)  -- satu user hanya bisa like sekali per post
);

CREATE TABLE post_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- VIEWS LOG (dasar untuk Dashboard Insight - tren harian)
-- ------------------------------------------------------------
CREATE TABLE post_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    viewer_id   UUID REFERENCES users(id) ON DELETE SET NULL, -- null = viewer anonim/tidak login
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- CHAT SOSIAL (percakapan 1-ke-1 antar user, teks/gambar/emoji)
-- ------------------------------------------------------------
CREATE TABLE conversations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- content diisi untuk pesan teks/emoji (emoji cukup disimpan sebagai teks
-- unicode biasa), image_url diisi untuk pesan gambar. Salah satu wajib ada.
CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content          TEXT,
    image_url        VARCHAR(255),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

-- ------------------------------------------------------------
-- CHAT SOSIAL
-- ------------------------------------------------------------
CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now() -- diperbarui tiap ada pesan baru, untuk sorting daftar chat
);

CREATE TABLE conversation_participants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conversation_id, user_id)
);

CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type     VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text' | 'image' (emoji ikut sebagai teks unicode)
    content          TEXT,        -- isi teks, atau caption untuk pesan gambar
    media_url        VARCHAR(255), -- diisi jika message_type = 'image'
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at          TIMESTAMPTZ  -- null = belum dibaca penerima
);

-- ------------------------------------------------------------
-- INDEX (mempercepat query feed, like count, comment list)
-- ------------------------------------------------------------
CREATE INDEX idx_posts_user_id        ON posts(user_id);
CREATE INDEX idx_posts_created_at     ON posts(created_at DESC);
CREATE INDEX idx_post_media_post_id   ON post_media(post_id);
CREATE INDEX idx_post_likes_post_id   ON post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_views_post_id    ON post_views(post_id);
CREATE INDEX idx_post_views_viewed_at  ON post_views(viewed_at);

-- ------------------------------------------------------------
-- CHAT SOSIAL (percakapan 1-on-1 antar user)
-- ------------------------------------------------------------
CREATE TABLE conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_two_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_one_id <> user_two_id)
);

-- Satu pasang user hanya boleh punya satu conversation, tanpa peduli urutannya
CREATE UNIQUE INDEX idx_conversations_pair
    ON conversations (LEAST(user_one_id, user_two_id), GREATEST(user_one_id, user_two_id));

CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content          TEXT,               -- teks biasa ATAU emoji (unicode langsung)
    media_url        VARCHAR(255),       -- diisi kalau message_type = 'image'
    message_type     VARCHAR(10) NOT NULL DEFAULT 'text', -- 'text' | 'image'
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at          TIMESTAMPTZ,
    CHECK (message_type IN ('text', 'image')),
    CHECK (
        (message_type = 'text'  AND content IS NOT NULL) OR
        (message_type = 'image' AND media_url IS NOT NULL)
    )
);

CREATE INDEX idx_conversations_user_one ON conversations(user_one_id);
CREATE INDEX idx_conversations_user_two ON conversations(user_two_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at      ON messages(created_at);

-- ------------------------------------------------------------
-- MARKETPLACE
-- ------------------------------------------------------------
CREATE TABLE products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active    BOOLEAN NOT NULL DEFAULT true, -- untuk "soft delete" / arsip produk
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_url   VARCHAR(255) NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- CHAT MARKETPLACE (terpisah dari chat sosial, terikat ke produk)
-- ------------------------------------------------------------
CREATE TABLE marketplace_conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (buyer_id <> seller_id)
);

-- Satu buyer hanya punya satu percakapan per produk
CREATE UNIQUE INDEX idx_mp_conversations_product_buyer
    ON marketplace_conversations (product_id, buyer_id);

CREATE TABLE marketplace_messages (
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

CREATE INDEX idx_products_seller_id       ON products(seller_id);
CREATE INDEX idx_products_created_at      ON products(created_at DESC);
CREATE INDEX idx_product_media_product_id ON product_media(product_id);
CREATE INDEX idx_mp_conversations_product ON marketplace_conversations(product_id);
CREATE INDEX idx_mp_conversations_buyer   ON marketplace_conversations(buyer_id);
CREATE INDEX idx_mp_conversations_seller  ON marketplace_conversations(seller_id);
CREATE INDEX idx_mp_messages_conversation ON marketplace_messages(conversation_id);

-- ------------------------------------------------------------
-- MARKETPLACE (produk)
-- ------------------------------------------------------------
CREATE TABLE products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active    BOOLEAN NOT NULL DEFAULT true, -- soft-delete / arsip produk
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_url   VARCHAR(255) NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_products_seller_id     ON products(seller_id);
CREATE INDEX idx_products_created_at    ON products(created_at DESC);
CREATE INDEX idx_product_media_product_id ON product_media(product_id);

-- ------------------------------------------------------------
-- CHAT MARKETPLACE (terpisah dari chat sosial, per produk)
-- ------------------------------------------------------------
CREATE TABLE marketplace_conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (buyer_id <> seller_id)
);

-- Satu buyer hanya punya satu percakapan per produk (nanya berkali-kali
-- soal produk yang sama tetap masuk thread yang sama)
CREATE UNIQUE INDEX idx_marketplace_conversations_product_buyer
    ON marketplace_conversations (product_id, buyer_id);

CREATE TABLE marketplace_messages (
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

CREATE INDEX idx_marketplace_conversations_buyer  ON marketplace_conversations(buyer_id);
CREATE INDEX idx_marketplace_conversations_seller ON marketplace_conversations(seller_id);
CREATE INDEX idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);
CREATE INDEX idx_marketplace_messages_created_at      ON marketplace_messages(created_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at      ON messages(created_at);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- ------------------------------------------------------------
-- TRIGGER: auto-update updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_mp_conversations_updated_at
    BEFORE UPDATE ON marketplace_conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_marketplace_conversations_updated_at
    BEFORE UPDATE ON marketplace_conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION touch_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_touch_conversation
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION touch_conversation_last_message();
