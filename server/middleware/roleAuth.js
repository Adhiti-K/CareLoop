/**
 * Role-Based Authorization Middleware Factory:
 * Enforces access control by verifying that the authenticated user's role
 * is included in the allowed roles list.
 *
 * CARELOOP Roles:
 * 'Admin', 'Doctor', 'Nurse', 'Patient', 'Caregiver', 'Care Coordinator'
 *
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authorization failed. User identity not established.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
