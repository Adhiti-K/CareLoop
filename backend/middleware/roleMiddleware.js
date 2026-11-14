const { sendError } = require('../utils/responseHandler');

/**
 * Restricts endpoint to specified roles
 * Allowed: 'admin', 'doctor', 'nurse', 'receptionist', 'patient', 'caregiver'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Access denied. Role not identified.', 403);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Access forbidden: Required role [${allowedRoles.join(', ')}]. You are [${req.user.role}]`, 403);
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
