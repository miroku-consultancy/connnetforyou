
const masterAdminMiddleware = (req, res, next) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = req.user?.email?.trim().toLowerCase();

    // Fail closed if admin email is not configured
    if (!adminEmail) {
      console.error('[MasterAdmin] ADMIN_EMAIL is not configured');

      return res.status(500).json({
        error: 'Admin access is not configured'
      });
    }

    if (!userEmail || userEmail !== adminEmail) {
      return res.status(403).json({
        error: 'Master admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('[MasterAdmin] Authorization error:', error);

    return res.status(500).json({
      error: 'Admin authorization failed'
    });
  }
};

module.exports = masterAdminMiddleware;
