const crypto = require('crypto');

/**
 * Generates cryptographically secure random token and its SHA-256 hash
 */
function generateSecureToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateSecureToken,
  hashToken
};
