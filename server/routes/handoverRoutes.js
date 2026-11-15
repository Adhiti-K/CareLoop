const express = require('express');
const router = express.Router();

const {
  assignCaregiver,
  revokeCaregiver,
  getHandoversByPatient,
  acknowledgeHandover
} = require('../controllers/handoverController');

const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');
const { verifyPatientAccess } = require('../middleware/patientAccess');

// Assign Caregiver (Doctor, Nurse, Care Coordinator, Admin, Patient)
router.post(
  '/assign',
  authenticateToken,
  authorizeRoles('Doctor', 'Nurse', 'Care Coordinator', 'Admin', 'Patient'),
  assignCaregiver
);

// Revoke Caregiver Access
router.post(
  '/revoke',
  authenticateToken,
  authorizeRoles('Doctor', 'Nurse', 'Care Coordinator', 'Admin', 'Patient'),
  revokeCaregiver
);

// Get Handovers & Active Caregivers for a specific patient
router.get(
  '/patient/:patientId',
  authenticateToken,
  verifyPatientAccess,
  getHandoversByPatient
);

// Acknowledge or Decline Handover (Caregiver only)
router.post(
  '/:id/acknowledge',
  authenticateToken,
  authorizeRoles('Caregiver'),
  acknowledgeHandover
);

module.exports = router;
