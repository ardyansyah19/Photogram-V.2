const Insight = require('../models/Insight');

const insightController = {
  /**
   * GET /api/insights/overview
   */
  async getOverview(req, res) {
    try {
      const overview = await Insight.getOverview(req.user.id);
      return res.json({ success: true, data: overview });
    } catch (err) {
      console.error('[getOverview]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan insight.' });
    }
  },

  /**
   * GET /api/insights/top-posts?limit=5
   */
  async getTopPosts(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 5, 20);
      const posts = await Insight.getTopPosts(req.user.id, limit);
      return res.json({ success: true, data: posts });
    } catch (err) {
      console.error('[getTopPosts]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil post terbaik.' });
    }
  },

  /**
   * GET /api/insights/timeseries?days=14
   */
  async getTimeseries(req, res) {
    try {
      const days = Math.min(parseInt(req.query.days) || 14, 90);
      const series = await Insight.getTimeseries(req.user.id, days);
      return res.json({ success: true, data: series });
    } catch (err) {
      console.error('[getTimeseries]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil tren insight.' });
    }
  },
};

module.exports = insightController;
