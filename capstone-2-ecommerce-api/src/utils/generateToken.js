const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the user id and role.
 *
 * The payload is base64-encoded, NOT encrypted - anyone can decode and read it.
 * Never put a password, a card number, or anything secret in here.
 * The signature is what proves the token was not tampered with.
 */
function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined. Add it to your .env file.');
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
