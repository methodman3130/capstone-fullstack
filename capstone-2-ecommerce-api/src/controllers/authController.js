const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * Shapes a user for the client. Never send the password hash,
 * not even the hashed version.
 */
function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * @desc    Register a new account
 * @route   POST /api/auth/register
 * @access  Public
 * @success 201 Created
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with that email already exists',
      });
    }

    // `role` is accepted here only so you can create an admin during the demo.
    // In a real product you would NEVER let a client choose its own role -
    // that is instant privilege escalation. Remove this before production.
    const allowedRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role: allowedRole });

    return res.status(201).json({
      success: true,
      message: 'Account created',
      token: generateToken(user),
      data: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in and receive a JWT
 * @route   POST /api/auth/login
 * @access  Public
 * @success 200 OK
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // password has select: false on the schema, so ask for it explicitly.
    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

    // One identical message for "no such email" and "wrong password".
    // Saying which one was wrong tells an attacker which emails are registered.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in',
      token: generateToken(user),
      data: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 * @success 200 OK
 *
 * The client calls this on page load to turn a stored token back into a session.
 */
exports.getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: publicUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};
