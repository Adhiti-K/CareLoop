const express = require('express');
const router = express.Router();

const {
  createDischarge,
  getDischargesByPatient,
  getDischargeById,
  updateDischarge
} = require('../controllers/dischargeController');

const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');
const { verifyPatientAccess } = require('../middleware/patientAccess');

// Create Discharge Summary: Restricted strictly to licensed Doctors and Nurses
// Admin is intentionally prohibited from creating clinical discharge records.
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Doctor', 'Nurse'),
  createDischarge
);

// Get Discharge Summaries for a specific patient (Access strictly guarded)
router.get(
  '/patient/:patientId',
  authenticateToken,
  verifyPatientAccess,
  getDischargesByPatient
);

// Get Single Discharge Summary by ID
router.get(
  '/:id',
  authenticateToken,
  getDischargeById
);

// Update Discharge Summary (Doctor, Nurse)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Doctor', 'Nurse'),
  updateDischarge
);

module.exports = router;
