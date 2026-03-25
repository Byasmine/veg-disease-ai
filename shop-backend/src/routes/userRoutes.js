const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { fetchUserById } = require('../services/authService');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '') || '.jpg';
      cb(null, `${req.user.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await fetchUserById(req.user.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    const fullName = b.fullName != null ? String(b.fullName).trim() : undefined;
    const phone = b.phone != null ? String(b.phone).trim() : undefined;
    const addressLine1 = b.addressLine1 != null ? String(b.addressLine1).trim() : undefined;
    const addressLine2 = b.addressLine2 != null ? String(b.addressLine2).trim() : undefined;
    const city = b.city != null ? String(b.city).trim() : undefined;
    const postalCode = b.postalCode != null ? String(b.postalCode).trim() : undefined;
    const country = b.country != null ? String(b.country).trim() : undefined;

    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone),
        address_line1 = COALESCE($4, address_line1),
        address_line2 = COALESCE($5, address_line2),
        city = COALESCE($6, city),
        postal_code = COALESCE($7, postal_code),
        country = COALESCE($8, country)
      WHERE id = $1
      RETURNING id`,
      [
        req.user.id,
        fullName ?? null,
        phone ?? null,
        addressLine1 ?? null,
        addressLine2 ?? null,
        city ?? null,
        postalCode ?? null,
        country ?? null,
      ]
    );
    if (!rows[0]) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const user = await fetchUserById(req.user.id);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

router.post('/avatar', requireAuth, (req, res, next) => {
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message || 'Upload failed' });
    }
    try {
      const files = req.files || {};
      const file = files.photo?.[0] || files.file?.[0];
      if (!file) {
        return res
          .status(400)
          .json({ status: 'error', message: 'No file uploaded (multipart field name: photo or file)' });
      }
      const base =
        process.env.PUBLIC_BASE_URL ||
        `http://localhost:${Number(process.env.PORT || 8082)}`;
      const avatarUrl = `${base.replace(/\/$/, '')}/uploads/avatars/${file.filename}`;
      const pool = getPool();
      await pool.query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [avatarUrl, req.user.id]);
      const user = await fetchUserById(req.user.id);
      return res.json({ user, avatarUrl });
    } catch (e) {
      return next(e);
    }
  });
});

module.exports = router;
