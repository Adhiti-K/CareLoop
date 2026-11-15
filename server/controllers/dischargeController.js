const { pool } = require('../config/db');

const VALID_CONDITIONS = ['Stable', 'Requires Assistance', 'Critical Observation', 'Recovered'];
const VALID_STATUSES = ['Draft', 'Approved', 'Finalized'];

/**
 * Create Digital Discharge Summary
 * POST /api/discharge
 * Authorized: Doctor, Nurse only (Admin forbidden from clinical authoring)
 */
const createDischarge = async (req, res) => {
  try {
    const {
      patient_id,
      admission_date,
      discharge_date,
      diagnosis,
      discharge_condition = 'Stable',
      medications_summary,
      care_instructions,
      emergency_contact_name,
      emergency_contact_phone,
      status = 'Draft'
    } = req.body;

    // Strict role check: Doctor and Nurse only
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only licensed Doctors and Nurses may author clinical discharge summaries.'
      });
    }

    // 1. Validation
    if (!patient_id || !admission_date || !discharge_date || !diagnosis || !care_instructions) {
      return res.status(400).json({
        success: false,
        message: 'patient_id, admission_date, discharge_date, diagnosis, and care_instructions are required.'
      });
    }

    if (!VALID_CONDITIONS.includes(discharge_condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid discharge_condition. Must be one of: ${VALID_CONDITIONS.join(', ')}`
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Verify patient exists
    const [patientRows] = await pool.query('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (patientRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patient_id} not found.`
      });
    }

    // Assign doctor_id and nurse_id based on creator
    let doctorId = req.user.role === 'Doctor' ? req.user.id : (req.body.doctor_id || null);
    let nurseId = req.user.role === 'Nurse' ? req.user.id : (req.body.nurse_id || null);

    // If nurse creates, require a valid attending doctor_id
    if (!doctorId) {
      const [doctors] = await pool.query("SELECT id FROM users WHERE role = 'Doctor' AND is_active = TRUE LIMIT 1");
      if (doctors.length > 0) {
        doctorId = doctors[0].id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'An assigned attending doctor is required for the discharge summary.'
        });
      }
    }

    // Parameterized insert
    const [result] = await pool.query(
      `INSERT INTO discharge_summaries
       (patient_id, doctor_id, nurse_id, admission_date, discharge_date, diagnosis,
        discharge_condition, medications_summary, care_instructions,
        emergency_contact_name, emergency_contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        doctorId,
        nurseId,
        admission_date,
        discharge_date,
        diagnosis,
        discharge_condition,
        medications_summary || null,
        care_instructions,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        status
      ]
    );

    const [createdRows] = await pool.query(
      `SELECT d.*, u_doc.full_name as doctor_name, u_nurse.full_name as nurse_name
       FROM discharge_summaries d
       JOIN users u_doc ON d.doctor_id = u_doc.id
       LEFT JOIN users u_nurse ON d.nurse_id = u_nurse.id
       WHERE d.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Digital discharge summary created successfully.',
      discharge: createdRows[0]
    });
  } catch (error) {
    console.error('Create Discharge Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create discharge summary.'
    });
  }
};

/**
 * Retrieve Discharge Summaries for a Patient
 * GET /api/discharge/patient/:patientId
 * - Patient: can view own summaries.
 * - Staff (Doctor, Nurse, Coord, Admin): authorized clinical/admin access.
 * - Caregiver: requires ACTIVE mapping AND explicitly ACKNOWLEDGED handover.
 */
const getDischargesByPatient = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);

    // Explicit Caregiver Consent Check:
    // Active mapping alone is NOT sufficient. Caregiver must have an explicitly Acknowledged handover.
    if (req.user.role === 'Caregiver') {
      const [mappingRows] = await pool.query(
        'SELECT id FROM patient_caregiver_mappings WHERE patient_id = ? AND caregiver_id = ?',
        [patientId, req.user.caregiver_id]
      );

      if (mappingRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not an active caregiver for this patient.'
        });
      }

      const [ackRows] = await pool.query(
        `SELECT id FROM caregiver_handovers
         WHERE patient_id = ? AND caregiver_id = ? AND status = 'Acknowledged'`,
        [patientId, req.user.caregiver_id]
      );

      if (ackRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Caregiver must explicitly acknowledge care instructions before viewing clinical discharge records.'
        });
      }
    }

    const [rows] = await pool.query(
      `SELECT d.*,
              u_doc.full_name as doctor_name, u_doc.email as doctor_email,
              u_nurse.full_name as nurse_name,
              p.emergency_contact_name as patient_emergency_contact,
              p.emergency_contact_phone as patient_emergency_phone
       FROM discharge_summaries d
       JOIN users u_doc ON d.doctor_id = u_doc.id
       LEFT JOIN users u_nurse ON d.nurse_id = u_nurse.id
       JOIN patients p ON d.patient_id = p.id
       WHERE d.patient_id = ?
       ORDER BY d.discharge_date DESC, d.created_at DESC`,
      [patientId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      discharges: rows
    });
  } catch (error) {
    console.error('Get Discharges Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve discharge summaries.'
    });
  }
};

/**
 * Retrieve Single Discharge Summary by ID
 * GET /api/discharge/:id
 */
const getDischargeById = async (req, res) => {
  try {
    const dischargeId = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      `SELECT d.*,
              u_doc.full_name as doctor_name, u_doc.email as doctor_email,
              u_nurse.full_name as nurse_name
       FROM discharge_summaries d
       JOIN users u_doc ON d.doctor_id = u_doc.id
       LEFT JOIN users u_nurse ON d.nurse_id = u_nurse.id
       WHERE d.id = ?`,
      [dischargeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Discharge summary with ID ${dischargeId} not found.`
      });
    }

    const discharge = rows[0];

    // Verify patient access permission for this specific record
    if (req.user.role === 'Patient' && req.user.patient_id !== discharge.patient_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view another patient\'s discharge summary.'
      });
    }

    if (req.user.role === 'Caregiver') {
      const [mappings] = await pool.query(
        'SELECT id FROM patient_caregiver_mappings WHERE patient_id = ? AND caregiver_id = ?',
        [discharge.patient_id, req.user.caregiver_id]
      );
      if (mappings.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not an authorized caregiver for this patient.'
        });
      }

      const [ackRows] = await pool.query(
        `SELECT id FROM caregiver_handovers
         WHERE patient_id = ? AND caregiver_id = ? AND status = 'Acknowledged'`,
        [discharge.patient_id, req.user.caregiver_id]
      );

      if (ackRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Caregiver must explicitly acknowledge care instructions before viewing clinical discharge records.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      discharge
    });
  } catch (error) {
    console.error('Get Discharge By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve discharge summary.'
    });
  }
};

/**
 * Update Discharge Summary
 * PUT /api/discharge/:id
 * Authorized: Doctor, Nurse
 * - Finalized records are STRICTLY LOCKED and cannot be modified by any role.
 */
const updateDischarge = async (req, res) => {
  try {
    const dischargeId = parseInt(req.params.id, 10);

    const [existingRows] = await pool.query(
      'SELECT * FROM discharge_summaries WHERE id = ?',
      [dischargeId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Discharge summary with ID ${dischargeId} not found.`
      });
    }

    const current = existingRows[0];

    // Finalized Protection: Prevent all ordinary updates once finalized
    if (current.status === 'Finalized') {
      return res.status(403).json({
        success: false,
        message: 'Discharge summary is finalized and locked. Finalized medical records cannot be modified.'
      });
    }

    const {
      admission_date,
      discharge_date,
      diagnosis,
      discharge_condition,
      medications_summary,
      care_instructions,
      emergency_contact_name,
      emergency_contact_phone,
      status
    } = req.body;

    if (discharge_condition && !VALID_CONDITIONS.includes(discharge_condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid discharge_condition. Must be one of: ${VALID_CONDITIONS.join(', ')}`
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    await pool.query(
      `UPDATE discharge_summaries SET
        admission_date = COALESCE(?, admission_date),
        discharge_date = COALESCE(?, discharge_date),
        diagnosis = COALESCE(?, diagnosis),
        discharge_condition = COALESCE(?, discharge_condition),
        medications_summary = COALESCE(?, medications_summary),
        care_instructions = COALESCE(?, care_instructions),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        admission_date || null,
        discharge_date || null,
        diagnosis || null,
        discharge_condition || null,
        medications_summary || null,
        care_instructions || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        status || null,
        dischargeId
      ]
    );

    const [updatedRows] = await pool.query(
      `SELECT d.*, u_doc.full_name as doctor_name, u_nurse.full_name as nurse_name
       FROM discharge_summaries d
       JOIN users u_doc ON d.doctor_id = u_doc.id
       LEFT JOIN users u_nurse ON d.nurse_id = u_nurse.id
       WHERE d.id = ?`,
      [dischargeId]
    );

    return res.status(200).json({
      success: true,
      message: 'Discharge summary updated successfully.',
      discharge: updatedRows[0]
    });
  } catch (error) {
    console.error('Update Discharge Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update discharge summary.'
    });
  }
};

module.exports = {
  createDischarge,
  getDischargesByPatient,
  getDischargeById,
  updateDischarge
};
