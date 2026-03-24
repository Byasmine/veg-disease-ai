function requireAuth(req, res, next) {
  const userId = req.header('x-user-id');

  // Placeholder auth for MVP:
  // - In production, replace with Firebase Admin token verification.
  // - Keep x-user-id for local testing.
  if (!userId) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: provide x-user-id header (or Firebase bearer token in future).',
    });
  }

  req.user = { id: userId };
  return next();
}

module.exports = { requireAuth };
