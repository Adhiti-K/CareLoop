const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');
const { verifyPatientAccess } = require('../middleware/patientAccess');

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

// Authenticated User Endpoints
router.get('/me', authenticateToken, getMe);

// ---------------------------------------------------------------------
// Role-Based Authorization & Patient Data Access Verification Routes
// Used to test and enforce access restrictions across all six roles
// ---------------------------------------------------------------------

// Admin Only
router.get('/test/admin-only', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Admin access granted.',
    user: req.user
  });
});

// Clinical Staff Only (Doctor, Nurse)
router.get('/test/clinical', authenticateToken, authorizeRoles('Doctor', 'Nurse'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Clinical staff access granted.',
    user: req.user
  });
});

// Care Coordination (Care Coordinator, Admin)
router.get('/test/coordination', authenticateToken, authorizeRoles('Care Coordinator', 'Admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Care coordination access granted.',
    user: req.user
  });
});

// Patient Only
router.get('/test/patient-only', authenticateToken, authorizeRoles('Patient'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Patient self-service access granted.',
    user: req.user
  });
});

// Caregiver Only
router.get('/test/caregiver-only', authenticateToken, authorizeRoles('Caregiver'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Caregiver portal access granted.',
    user: req.user
  });
});

// Patient Medical Data Access (Strictly isolated by verifyPatientAccess)
router.get('/test/patient-data/:patientId', authenticateToken, verifyPatientAccess, (req, res) => {
  res.status(200).json({
    success: true,
    message: `Authorized: Access granted to medical records of patient ${req.params.patientId}.`,
    patientId: parseInt(req.params.patientId, 10),
    accessedBy: {
      userId: req.user.id,
      role: req.user.role,
      name: req.user.full_name
    }
  });
});

module.exports = router;
