const { verifyToken } = require('../services/authService');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  const user = verifyToken(token);
  if (!user || !user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: sign in and send Authorization: Bearer <token>.',
    });
  }

  req.user = { id: user.id, email: user.email };
  return next();
}

module.exports = { requireAuth };
