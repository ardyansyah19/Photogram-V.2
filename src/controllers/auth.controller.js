const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

const authController = {
  /**
   * POST /api/auth/register
   * body: { username, email, password, fullName? }
   */
  async register(req, res) {
    try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, dan password wajib diisi.',
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter.',
        });
      }

      const [existingEmail, existingUsername] = await Promise.all([
        User.findByEmail(email),
        User.findByUsername(username),
      ]);

      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
      }
      if (existingUsername) {
        return res.status(409).json({ success: false, message: 'Username sudah dipakai.' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ username, email, passwordHash, fullName });
      const token = generateToken(user);

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ username, email, passwordHash, fullName });
      const token = generateToken(user);

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ username, email, passwordHash, fullName });
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil.',
        data: { user, token },
      });
    } catch (err) {
      console.error('[register]', err);
      return res.status(500).json({ success: false, message: 'Gagal melakukan registrasi.' });
    }
  },

  /**
   * POST /api/auth/login
   * body: { email, password }
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password wajib diisi.',
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email atau password salah.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email atau password salah.' });
      }

      const token = generateToken(user);
      const { password_hash, ...safeUser } = user;

      return res.json({
        success: true,
        message: 'Login berhasil.',
        data: { user: safeUser, token },
      });
    } catch (err) {
      console.error('[login]', err);
      return res.status(500).json({ success: false, message: 'Gagal login.' });
    }
  },

  /**
   * GET /api/auth/me  (butuh token)
   */
  async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }
      return res.json({ success: true, data: user });
    } catch (err) {
      console.error('[me]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data user.' });
    }
  },
};

module.exports = authController;
