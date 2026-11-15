const { pool } = require('../config/db');

/**
 * Assign Caregiver to Patient
 * POST /api/handover/assign
 * Authorized: Doctor, Nurse, Care Coordinator, Admin, Patient (can assign caregiver to self)
 */
const assignCaregiver = async (req, res) => {
  let connection;
  try {
    const {
      patient_id,
      caregiver_id,
      is_primary = true,
      // Optional: attach handover record directly during assignment
      discharge_id,
      handover_notes,
      care_responsibilities
    } = req.body;

    // 1. Validation
    if (!patient_id || !caregiver_id) {
      return res.status(400).json({
        success: false,
        message: 'patient_id and caregiver_id are required.'
      });
    }

    // If Patient is assigning, they can only assign to themselves
    if (req.user.role === 'Patient' && req.user.patient_id !== parseInt(patient_id, 10)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Patients may only manage their own caregivers.'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify patient exists
    const [patientRows] = await connection.query(
      `SELECT p.id, u.full_name as patient_name, u.email as patient_email
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [patient_id]
    );
    if (patientRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patient_id} not found.`
      });
    }

    // Verify caregiver exists
    const [caregiverRows] = await connection.query(
      `SELECT c.id, c.relationship_to_patient, u.full_name as caregiver_name, u.email as caregiver_email
       FROM caregivers c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [caregiver_id]
    );
    if (caregiverRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: `Caregiver with ID ${caregiver_id} not found.`
      });
    }

    // Insert or update patient_caregiver_mappings
    await connection.query(
      `INSERT INTO patient_caregiver_mappings (patient_id, caregiver_id, is_primary)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary)`,
      [patient_id, caregiver_id, is_primary ? 1 : 0]
    );

    let createdHandover = null;

    // If handover details were provided, create digital handover record
    if (discharge_id && handover_notes && care_responsibilities) {
      // Verify discharge summary exists
      const [dischargeRows] = await connection.query(
        'SELECT id FROM discharge_summaries WHERE id = ? AND patient_id = ?',
        [discharge_id, patient_id]
      );

      if (dischargeRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Discharge summary with ID ${discharge_id} does not match patient ${patient_id}.`
        });
      }

      const [handoverResult] = await connection.query(
        `INSERT INTO caregiver_handovers
         (discharge_id, patient_id, caregiver_id, assigned_by_id, handover_notes, care_responsibilities, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending Acknowledgment')`,
        [discharge_id, patient_id, caregiver_id, req.user.id, handover_notes, care_responsibilities]
      );

      const [hRows] = await connection.query(
        'SELECT * FROM caregiver_handovers WHERE id = ?',
        [handoverResult.insertId]
      );
      createdHandover = hRows[0];
    }

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: `Caregiver ${caregiverRows[0].caregiver_name} successfully assigned to patient ${patientRows[0].patient_name}.`,
      assignment: {
        patient_id: parseInt(patient_id, 10),
        patient_name: patientRows[0].patient_name,
        caregiver_id: parseInt(caregiver_id, 10),
        caregiver_name: caregiverRows[0].caregiver_name,
        relationship: caregiverRows[0].relationship_to_patient,
        is_primary: !!is_primary
      },
      handover: createdHandover
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Assign Caregiver Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign caregiver.'
    });
  }
};

/**
 * Revoke Caregiver Access
 * POST /api/handover/revoke
 * Authorized: Doctor, Nurse, Care Coordinator, Admin, Patient (own caregivers)
 */
const revokeCaregiver = async (req, res) => {
  try {
    const { patient_id, caregiver_id } = req.body;

    if (!patient_id || !caregiver_id) {
      return res.status(400).json({
        success: false,
        message: 'patient_id and caregiver_id are required to revoke access.'
      });
    }

    // Patient can only revoke caregivers for their own profile
    if (req.user.role === 'Patient' && req.user.patient_id !== parseInt(patient_id, 10)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Patients may only revoke their own caregivers.'
      });
    }

    const [deleteResult] = await pool.query(
      'DELETE FROM patient_caregiver_mappings WHERE patient_id = ? AND caregiver_id = ?',
      [patient_id, caregiver_id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active caregiver assignment found matching this patient and caregiver.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Access revoked: Caregiver ${caregiver_id} can no longer access records for patient ${patient_id}.`
    });
  } catch (error) {
    console.error('Revoke Caregiver Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke caregiver access.'
    });
  }
};

/**
 * Retrieve Handover Records and Active Caregivers for a Patient
 * GET /api/handover/patient/:patientId
 * Protected by verifyPatientAccess
 */
const getHandoversByPatient = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);

    // 1. Fetch assigned caregivers
    const [assignedCaregivers] = await pool.query(
      `SELECT m.id as mapping_id, m.is_primary, m.created_at as assigned_at,
              c.id as caregiver_id, c.relationship_to_patient, c.emergency_phone,
              u.full_name as caregiver_name, u.email as caregiver_email, u.phone as user_phone
       FROM patient_caregiver_mappings m
       JOIN caregivers c ON m.caregiver_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE m.patient_id = ?`,
      [patientId]
    );

    // 2. Fetch digital handover logs
    const [handoverLogs] = await pool.query(
      `SELECT h.*,
              u_care.full_name as caregiver_name, u_care.email as caregiver_email,
              u_by.full_name as assigned_by_name, u_by.role as assigned_by_role,
              d.diagnosis, d.discharge_date, d.status as discharge_status
       FROM caregiver_handovers h
       JOIN caregivers c ON h.caregiver_id = c.id
       JOIN users u_care ON c.user_id = u_care.id
       JOIN users u_by ON h.assigned_by_id = u_by.id
       JOIN discharge_summaries d ON h.discharge_id = d.id
       WHERE h.patient_id = ?
       ORDER BY h.created_at DESC`,
      [patientId]
    );

    return res.status(200).json({
      success: true,
      patient_id: patientId,
      active_caregivers: assignedCaregivers,
      handovers: handoverLogs
    });
  } catch (error) {
    console.error('Get Handovers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve handover records.'
    });
  }
};

/**
 * Acknowledge or Decline Digital Handover
 * POST /api/handover/:id/acknowledge
 * Authorized: Caregiver (specifically assigned caregiver with ACTIVE mapping)
 */
const acknowledgeHandover = async (req, res) => {
  try {
    const handoverId = parseInt(req.params.id, 10);
    const { status, caregiver_signature_name } = req.body;

    if (!status || !['Acknowledged', 'Declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status is required and must be either 'Acknowledged' or 'Declined'."
      });
    }

    if (status === 'Acknowledged' && (!caregiver_signature_name || caregiver_signature_name.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'caregiver_signature_name is required when acknowledging care responsibilities.'
      });
    }

    // 1. Verify handover exists
    const [handoverRows] = await pool.query(
      'SELECT * FROM caregiver_handovers WHERE id = ?',
      [handoverId]
    );

    if (handoverRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Handover record with ID ${handoverId} not found.`
      });
    }

    const handover = handoverRows[0];

    // 2. Verify requesting user is the designated caregiver
    if (req.user.caregiver_id !== handover.caregiver_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the designated caregiver may acknowledge or decline this handover.'
      });
    }

    // 3. Security Correction: Verify caregiver relationship is still ACTIVE
    // Revoked caregivers MUST NOT acknowledge or decline historical handovers
    const [activeMapping] = await pool.query(
      'SELECT id FROM patient_caregiver_mappings WHERE patient_id = ? AND caregiver_id = ?',
      [handover.patient_id, req.user.caregiver_id]
    );

    if (activeMapping.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Caregiver relationship with this patient has been revoked.'
      });
    }

    // Parameterized update
    await pool.query(
      `UPDATE caregiver_handovers SET
        status = ?,
        acknowledged_at = CURRENT_TIMESTAMP,
        caregiver_signature_name = ?
       WHERE id = ?`,
      [status, caregiver_signature_name ? caregiver_signature_name.trim() : null, handoverId]
    );

    const [updatedRows] = await pool.query(
      `SELECT h.*,
              u_care.full_name as caregiver_name,
              u_by.full_name as assigned_by_name,
              d.diagnosis
       FROM caregiver_handovers h
       JOIN caregivers c ON h.caregiver_id = c.id
       JOIN users u_care ON c.user_id = u_care.id
       JOIN users u_by ON h.assigned_by_id = u_by.id
       JOIN discharge_summaries d ON h.discharge_id = d.id
       WHERE h.id = ?`,
      [handoverId]
    );

    return res.status(200).json({
      success: true,
      message: `Handover successfully ${status.toLowerCase()}.`,
      handover: updatedRows[0]
    });
  } catch (error) {
    console.error('Acknowledge Handover Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process handover acknowledgment.'
    });
  }
};

module.exports = {
  assignCaregiver,
  revokeCaregiver,
  getHandoversByPatient,
  acknowledgeHandover
};
