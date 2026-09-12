const jwt = require('jsonwebtoken');

/**
 * Memverifikasi JWT dari header Authorization: Bearer <token>
 * Menempelkan payload user (id, username) ke req.user.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa.',
    });
  }
}

module.exports = authMiddleware;
