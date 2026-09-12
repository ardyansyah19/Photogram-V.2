const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const insightController = require('../controllers/insight.controller');

router.get('/overview', authMiddleware, insightController.getOverview);
router.get('/top-posts', authMiddleware, insightController.getTopPosts);
router.get('/timeseries', authMiddleware, insightController.getTimeseries);

module.exports = router;
