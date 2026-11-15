const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Authentication Middleware:
 * Verifies JWT token in Authorization header, checks if user is active in DB,
 * and attaches user profile (including patient_id / caregiver_id if applicable) to req.user.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Authorization header missing.'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Expected format: Bearer <token>'
      });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'careloop_dev_secret_fallback';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid token signature or malformed token.'
      });
    }

    // Verify user exists and is active in database using parameterized query
    const [users] = await pool.query(
      'SELECT id, full_name, email, role, phone, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account has been deactivated. Contact an administrator.'
      });
    }

    // Attach role-specific IDs
    let patientId = null;
    let caregiverId = null;

    if (user.role === 'Patient') {
      const [patients] = await pool.query(
        'SELECT id FROM patients WHERE user_id = ?',
        [user.id]
      );
      if (patients.length > 0) {
        patientId = patients[0].id;
      }
    } else if (user.role === 'Caregiver') {
      const [caregivers] = await pool.query(
        'SELECT id FROM caregivers WHERE user_id = ?',
        [user.id]
      );
      if (caregivers.length > 0) {
        caregiverId = caregivers[0].id;
      }
    }

    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      patient_id: patientId,
      caregiver_id: caregiverId
    };

    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error processing token.'
    });
  }
};

module.exports = {
  authenticateToken
};
