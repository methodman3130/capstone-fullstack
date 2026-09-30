const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT on the Authorization header and attaches the user to req.
 *
 * Expected header:  Authorization: Bearer <token>
 *
 * 401 Unauthorized = "I do not know who you are."
 * 403 Forbidden    = "I know who you are, and you are not allowed."
 * Those are different failures. Do not use 401 for both.
 */
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look the user up fresh on every request. If the account was deleted
    // or its role changed, a still-valid token must not keep working.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Invalid token.',
      });
    }
    next(error);
  }
};

/**
 * Role gate. Use AFTER protect, which is what sets req.user.
 *
 *   router.delete('/:id', protect, authorize('admin'), deleteProduct);
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Authenticate first.',
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This action requires: ${roles.join(' or ')}.`,
    });
  }

  next();
};
