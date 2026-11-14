const express = require('express');
const router = express.Router();

const {
  generatePassport,
  verifyPassportPublic,
  getPassportByPatient,
  updatePassportStatus
} = require('../controllers/passportController');

const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');
const { createRateLimiter } = require('../middleware/rateLimiter');

// Rate limiter for public verification endpoint (50 requests per minute per IP)
const verifyLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 50,
  message: 'Too many verification requests. Please try again after one minute.'
});

// Generate or Regenerate QR Recovery Passport: Restricted strictly to Doctors and Nurses
router.post(
  '/generate/:patientId',
  authenticateToken,
  authorizeRoles('Doctor', 'Nurse'),
  generatePassport
);

// Public QR Verification Endpoint (Rate limited, zero PHI returned)
router.get(
  '/verify/:token',
  verifyLimiter,
  verifyPassportPublic
);

// Authenticated Patient & Caregiver Passport Retrieval (Patient isolation & caregiver consent enforced)
router.get(
  '/patient/:patientId',
  authenticateToken,
  getPassportByPatient
);

// Update Passport Status (Suspend or Reactivate): Restricted strictly to Doctors and Nurses
router.put(
  '/status/:patientId',
  authenticateToken,
  authorizeRoles('Doctor', 'Nurse'),
  updatePassportStatus
);

module.exports = router;
