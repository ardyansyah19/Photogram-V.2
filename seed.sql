-- ============================================================
-- SEED DATA - untuk testing modul Feed
-- Password untuk kedua user contoh: "password123"
-- (hash bcrypt di bawah dibuat dengan salt rounds 10)
-- ============================================================

INSERT INTO users (id, username, email, password_hash, full_name, bio, profile_photo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ahmadriko', 'ahmad@example.com',
   '$2b$10$CwTycUXWue0Thq9StjUM0uJ8O9Vd8WMHOh1MRuq6zqPCM8V3G8lHu',
   'Ahmad Riko', 'Full-stack developer & pengusaha rental motor.', NULL),
  ('22222222-2222-2222-2222-222222222222', 'sitinur', 'siti@example.com',
   '$2b$10$CwTycUXWue0Thq9StjUM0uJ8O9Vd8WMHOh1MRuq6zqPCM8V3G8lHu',
   'Siti Nur', 'Suka fotografi dan jalan-jalan.', NULL);

INSERT INTO posts (id, user_id, caption)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'Motor baru siap disewakan! 🏍️');

INSERT INTO post_media (post_id, media_url, media_type, position)
VALUES
  ('33333333-3333-3333-3333-333333333333', '/uploads/posts/sample1.jpg', 'image', 0);

INSERT INTO post_likes (post_id, user_id)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

INSERT INTO post_comments (post_id, user_id, content)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Keren! Tersedia warna lain nggak?');
