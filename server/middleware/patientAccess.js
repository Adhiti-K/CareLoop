const { pool } = require('../config/db');

/**
 * Patient Data Access Restriction Middleware:
 * Ensures patient data is strictly guarded according to CARELOOP privacy rules:
 * - Admin, Doctor, Nurse, Care Coordinator: clinical/administrative staff access.
 * - Patient: can ONLY access their own records (patient_id === req.user.patient_id).
 * - Caregiver: can ONLY access records of patients linked to them in patient_caregiver_mappings.
 *
 * Checks target patientId from req.params.patientId, req.query.patientId, or req.body.patientId.
 */
const verifyPatientAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const { role, patient_id, caregiver_id } = req.user;

    // Clinical and administrative roles have authorized system-wide access
    if (['Admin', 'Doctor', 'Nurse', 'Care Coordinator'].includes(role)) {
      return next();
    }

    // Determine target patient ID from params, query, or body
    const targetPatientId = parseInt(
      req.params.patientId || req.query.patientId || req.body.patient_id,
      10
    );

    if (!targetPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Target patient identification is required.'
      });
    }

    // If role is Patient: must match own patient record
    if (role === 'Patient') {
      if (patient_id !== targetPatientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Patients may only access their own recovery data.'
        });
      }
      return next();
    }

    // If role is Caregiver: must have verified active mapping to patient
    if (role === 'Caregiver') {
      if (!caregiver_id) {
        return res.status(403).json({
          success: false,
          message: 'Caregiver profile not found.'
        });
      }

      const [mappings] = await pool.query(
        'SELECT id FROM patient_caregiver_mappings WHERE patient_id = ? AND caregiver_id = ?',
        [targetPatientId, caregiver_id]
      );

      if (mappings.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view this patient\'s recovery information.'
        });
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: Unauthorized role.'
    });
  } catch (error) {
    console.error('Patient Access Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal error verifying patient data access.'
    });
  }
};

module.exports = {
  verifyPatientAccess
};
