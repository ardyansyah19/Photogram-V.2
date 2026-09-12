const db = require('../config/database');

const Insight = {
  /**
   * Ringkasan total: jumlah post, like, komentar, dan views yang
   * diterima oleh SEMUA post milik userId.
   */
  async getOverview(userId) {
    const result = await db.query(
      `SELECT
          (SELECT COUNT(*) FROM posts WHERE user_id = $1)::int AS total_posts,
          (SELECT COUNT(*) FROM post_likes pl
             JOIN posts p ON p.id = pl.post_id
             WHERE p.user_id = $1)::int AS total_likes,
          (SELECT COUNT(*) FROM post_comments c
             JOIN posts p ON p.id = c.post_id
             WHERE p.user_id = $1)::int AS total_comments,
          (SELECT COUNT(*) FROM post_views v
             JOIN posts p ON p.id = v.post_id
             WHERE p.user_id = $1)::int AS total_views
       `,
      [userId]
    );
    return result.rows[0];
  },

  /**
   * Post dengan performa terbaik milik userId, diurutkan berdasarkan
   * skor engagement sederhana (like + comment*2 + view*0.1).
   */
  async getTopPosts(userId, limit = 5) {
    const result = await db.query(
      `SELECT
          p.id, p.caption, p.views_count, p.created_at,
          COALESCE(pm.first_media, NULL) AS thumbnail,
          COALESCE(lc.like_count, 0)::int AS like_count,
          COALESCE(cc.comment_count, 0)::int AS comment_count,
          COALESCE(vc.view_count, 0)::int AS view_count,
          (COALESCE(lc.like_count, 0) + COALESCE(cc.comment_count, 0) * 2 + COALESCE(vc.view_count, 0) * 0.1)
            AS engagement_score
       FROM posts p
       LEFT JOIN LATERAL (
          SELECT media_url AS first_media FROM post_media
          WHERE post_id = p.id ORDER BY position ASC LIMIT 1
       ) pm ON true
       LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM post_likes GROUP BY post_id) lc
              ON lc.post_id = p.id
       LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM post_comments GROUP BY post_id) cc
              ON cc.post_id = p.id
       LEFT JOIN (SELECT post_id, COUNT(*) AS view_count FROM post_views GROUP BY post_id) vc
              ON vc.post_id = p.id
       WHERE p.user_id = $1
       ORDER BY engagement_score DESC, p.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  /**
   * Tren harian (likes, comments, views) selama N hari terakhir,
   * digabung dari seluruh post milik userId. Hari tanpa aktivitas
   * tetap muncul dengan nilai 0 (generate_series).
   */
  async getTimeseries(userId, days = 14) {
    const result = await db.query(
      `WITH days AS (
          SELECT generate_series(
            (CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day'),
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS day
       ),
       likes_per_day AS (
          SELECT date_trunc('day', pl.created_at)::date AS day, COUNT(*) AS count
          FROM post_likes pl
          JOIN posts p ON p.id = pl.post_id
          WHERE p.user_id = $1 AND pl.created_at >= CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day'
          GROUP BY 1
       ),
       comments_per_day AS (
          SELECT date_trunc('day', c.created_at)::date AS day, COUNT(*) AS count
          FROM post_comments c
          JOIN posts p ON p.id = c.post_id
          WHERE p.user_id = $1 AND c.created_at >= CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day'
          GROUP BY 1
       ),
       views_per_day AS (
          SELECT date_trunc('day', v.viewed_at)::date AS day, COUNT(*) AS count
          FROM post_views v
          JOIN posts p ON p.id = v.post_id
          WHERE p.user_id = $1 AND v.viewed_at >= CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day'
          GROUP BY 1
       )
       SELECT
          d.day,
          COALESCE(l.count, 0)::int AS likes,
          COALESCE(c.count, 0)::int AS comments,
          COALESCE(v.count, 0)::int AS views
       FROM days d
       LEFT JOIN likes_per_day l ON l.day = d.day
       LEFT JOIN comments_per_day c ON c.day = d.day
       LEFT JOIN views_per_day v ON v.day = d.day
       ORDER BY d.day ASC`,
      [userId, days]
    );
    return result.rows;
  },
};

module.exports = Insight;
