-- Jalankan file ini jika database kamu sudah dibuat dari schema.sql versi
-- sebelum modul Dashboard Insight (belum ada tabel post_views).
-- Jika baru setup dari nol, cukup jalankan schema.sql terbaru saja.

CREATE TABLE IF NOT EXISTS post_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    viewer_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id   ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON post_views(viewed_at);
