const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/db');

const VALID_RECOVERY_STATUSES = ['In Recovery', 'Fully Recovered', 'Under Observation', 'Requires Follow-up'];
const VALID_PASSPORT_STATUSES = ['Active', 'Suspended', 'Expired'];

/**
 * Generate or Regenerate QR-Based Digital Recovery Passport
 * POST /api/passport/generate/:patientId
 * Authorized: Doctor, Nurse only
 *
 * Security:
 * - Generates 256-bit cryptographically secure random token.
 * - Stores ONLY the SHA-256 hash in recovery_passports.passport_token.
 * - Raw token is encoded ONLY in the QR verification URL; never logged.
 * - Regenerating immediately overwrites the hash, invalidating previous QR codes.
 */
const generatePassport = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);
    const { recovery_status = 'In Recovery', expires_in_days = 365 } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Valid patientId is required.'
      });
    }

    if (!VALID_RECOVERY_STATUSES.includes(recovery_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recovery_status. Must be one of: ${VALID_RECOVERY_STATUSES.join(', ')}`
      });
    }

    // Verify patient exists
    const [patients] = await pool.query('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} not found.`
      });
    }

    // 1. Generate 256-bit cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Compute SHA-256 hash for secure storage at rest
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Construct public verification URL (contains raw token for verification lookup)
    const baseUrl = process.env.PASSPORT_BASE_URL || 'http://localhost:5000/api/passport/verify';
    const verificationUrl = `${baseUrl}/${rawToken}`;

    // 4. Generate QR Code image encoding ONLY the verification URL (Zero PHI in QR)
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const expiresInDaysInt = Math.max(1, parseInt(expires_in_days, 10) || 365);

    // 5. Store SHA-256 hash in database (Overwrites any previous token hash)
    await pool.query(
      `INSERT INTO recovery_passports
       (patient_id, passport_token, recovery_status, qr_code_data_url, status, issued_at, expires_at)
       VALUES (?, ?, ?, ?, 'Active', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))
       ON DUPLICATE KEY UPDATE
         passport_token = VALUES(passport_token),
         recovery_status = VALUES(recovery_status),
         qr_code_data_url = VALUES(qr_code_data_url),
         status = 'Active',
         issued_at = CURRENT_TIMESTAMP,
         expires_at = VALUES(expires_at)`,
      [patientId, tokenHash, recovery_status, qrCodeDataUrl, expiresInDaysInt]
    );

    const [rows] = await pool.query(
      `SELECT id, patient_id, recovery_status, status, issued_at, expires_at, qr_code_data_url
       FROM recovery_passports WHERE patient_id = ?`,
      [patientId]
    );

    const passport = rows[0];

    return res.status(201).json({
      success: true,
      message: 'Recovery passport and secure QR code generated successfully.',
      passport: {
        id: passport.id,
        patient_id: passport.patient_id,
        recovery_status: passport.recovery_status,
        status: passport.status,
        issued_at: passport.issued_at,
        expires_at: passport.expires_at,
        verification_url: verificationUrl,
        qr_code_data_url: passport.qr_code_data_url
      }
    });
  } catch (error) {
    console.error('Generate Passport Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate recovery passport.'
    });
  }
};

/**
 * Public QR Passport Verification Endpoint
 * GET /api/passport/verify/:token
 * Publicly accessible (e.g., scanning physical QR badge)
 *
 * Security:
 * - Rate limited against brute force attempts.
 * - Computes SHA-256 hash of token to match stored hash.
 * - Rejects invalid, suspended, and expired tokens.
 * - NEVER exposes sensitive medical information (no diagnosis, medications, address, or patient name).
 */
const verifyPassportPublic = async (req, res) => {
  try {
    const rawToken = req.params.token;

    if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 16) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or unknown recovery passport token.'
      });
    }

    // Compute SHA-256 hash of provided token
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Parameterized lookup by token hash
    const [rows] = await pool.query(
      `SELECT id, patient_id, recovery_status, status, issued_at, expires_at
       FROM recovery_passports WHERE passport_token = ?`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or unknown recovery passport token.'
      });
    }

    const passport = rows[0];

    // Check Suspended status
    if (passport.status === 'Suspended') {
      return res.status(403).json({
        valid: false,
        passport_status: 'Suspended',
        message: 'This recovery passport has been suspended by healthcare personnel.'
      });
    }

    // Check Expiration
    const isExpired = passport.status === 'Expired' || (passport.expires_at && new Date(passport.expires_at) < new Date());
    if (isExpired) {
      return res.status(410).json({
        valid: false,
        passport_status: 'Expired',
        message: 'This recovery passport has expired.'
      });
    }

    // Return ONLY minimal verification status (Strict Zero-PHI enforcement)
    return res.status(200).json({
      valid: true,
      passport_status: passport.status,
      recovery_status: passport.recovery_status,
      issued_at: passport.issued_at,
      expires_at: passport.expires_at,
      verification_message: 'Valid CareLoop Digital Recovery Passport',
      issuer: 'CareLoop Continuity of Care Network'
    });
  } catch (error) {
    console.error('Verify Passport Error:', error);
    return res.status(500).json({
      valid: false,
      message: 'Failed to verify recovery passport.'
    });
  }
};

/**
 * Retrieve Authenticated Recovery Passport Details
 * GET /api/passport/patient/:patientId
 *
 * Security:
 * - Patient: can access only their own passport.
 * - Caregiver: requires active mapping AND an explicitly Acknowledged handover.
 * - Staff: Doctor, Nurse, Care Coordinator, Admin.
 */
const getPassportByPatient = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);

    // 1. Role-Based Access Control
    if (req.user.role === 'Patient' && req.user.patient_id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Patients may only access their own recovery passport.'
      });
    }

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
          message: 'Access denied: Caregiver must explicitly acknowledge care instructions before viewing recovery passport details.'
        });
      }
    }

    // 2. Fetch passport record
    const [passportRows] = await pool.query(
      `SELECT id, patient_id, recovery_status, qr_code_data_url, status, issued_at, expires_at
       FROM recovery_passports WHERE patient_id = ?`,
      [patientId]
    );

    if (passportRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No recovery passport has been issued for patient ID ${patientId}.`
      });
    }

    const passport = passportRows[0];

    // 3. Fetch patient profile
    const [patientRows] = await pool.query(
      `SELECT p.id as patient_id, u.full_name as patient_name, p.emergency_contact_name, p.emergency_contact_phone
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [patientId]
    );

    // 4. Fetch latest Approved or Finalized discharge summary
    const [dischargeRows] = await pool.query(
      `SELECT d.id, d.diagnosis, d.discharge_condition, d.care_instructions, d.medications_summary, d.discharge_date,
              u_doc.full_name as doctor_name
       FROM discharge_summaries d
       JOIN users u_doc ON d.doctor_id = u_doc.id
       WHERE d.patient_id = ? AND d.status IN ('Approved', 'Finalized')
       ORDER BY d.discharge_date DESC, d.created_at DESC LIMIT 1`,
      [patientId]
    );

    // 5. Fetch next scheduled follow-up appointment
    const [appointmentRows] = await pool.query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.reason, a.status,
              u_doc.full_name as doctor_name
       FROM appointments a
       JOIN users u_doc ON a.doctor_id = u_doc.id
       WHERE a.patient_id = ? AND a.status = 'Scheduled' AND a.appointment_date >= CURDATE()
       ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 1`,
      [patientId]
    );

    // 6. Fetch primary assigned caregiver
    const [caregiverRows] = await pool.query(
      `SELECT c.id as caregiver_id, u.full_name as caregiver_name, c.relationship_to_patient, c.emergency_phone
       FROM patient_caregiver_mappings m
       JOIN caregivers c ON m.caregiver_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE m.patient_id = ? AND m.is_primary = TRUE LIMIT 1`,
      [patientId]
    );

    return res.status(200).json({
      success: true,
      passport: {
        id: passport.id,
        patient_id: passport.patient_id,
        patient_name: patientRows[0]?.patient_name || null,
        recovery_status: passport.recovery_status,
        status: passport.status,
        issued_at: passport.issued_at,
        expires_at: passport.expires_at,
        qr_code_data_url: passport.qr_code_data_url
      },
      latest_discharge: dischargeRows[0] || null,
      next_appointment: appointmentRows[0] || null,
      primary_caregiver: caregiverRows[0] || null,
      emergency_contact: {
        name: patientRows[0]?.emergency_contact_name || null,
        phone: patientRows[0]?.emergency_contact_phone || null
      }
    });
  } catch (error) {
    console.error('Get Passport Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recovery passport details.'
    });
  }
};

/**
 * Update Passport Status (Suspend or Reactivate)
 * PUT /api/passport/status/:patientId
 * Authorized: Doctor, Nurse only
 */
const updatePassportStatus = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);
    const { status, recovery_status } = req.body;

    if (!status && !recovery_status) {
      return res.status(400).json({
        success: false,
        message: 'At least one of status or recovery_status must be provided.'
      });
    }

    if (status && !VALID_PASSPORT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_PASSPORT_STATUSES.join(', ')}`
      });
    }

    if (recovery_status && !VALID_RECOVERY_STATUSES.includes(recovery_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recovery_status. Must be one of: ${VALID_RECOVERY_STATUSES.join(', ')}`
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM recovery_passports WHERE patient_id = ?',
      [patientId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Recovery passport for patient ${patientId} not found.`
      });
    }

    await pool.query(
      `UPDATE recovery_passports SET
        status = COALESCE(?, status),
        recovery_status = COALESCE(?, recovery_status)
       WHERE patient_id = ?`,
      [status || null, recovery_status || null, patientId]
    );

    const [updated] = await pool.query(
      `SELECT id, patient_id, recovery_status, status, issued_at, expires_at
       FROM recovery_passports WHERE patient_id = ?`,
      [patientId]
    );

    return res.status(200).json({
      success: true,
      message: 'Recovery passport status updated successfully.',
      passport: updated[0]
    });
  } catch (error) {
    console.error('Update Passport Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update recovery passport status.'
    });
  }
};

module.exports = {
  generatePassport,
  verifyPassportPublic,
  getPassportByPatient,
  updatePassportStatus
};
