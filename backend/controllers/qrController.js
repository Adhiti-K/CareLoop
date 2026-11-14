const QRCode = require('qrcode');
const mockStore = require('../database/mockStore');
const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { generateSecureToken, hashToken } = require('../utils/tokenGenerator');

/**
 * Generate or retrieve QR Recovery Passport for a patient
 */
async function generatePassport(req, res) {
  try {
    const { patientId } = req.params;
    const patient = mockStore.patients.find(p => p.patient_id === patientId || p.recovery_id === patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);

    // Check if active passport exists
    let passport = mockStore.recovery_passports.find(rp => rp.patient_id === patient.patient_id && rp.is_active);

    let rawToken;
    if (!passport) {
      const generated = generateSecureToken();
      rawToken = generated.token;
      
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1); // 1-year valid passport

      passport = {
        passport_id: `pass-${Date.now()}`,
        patient_id: patient.patient_id,
        recovery_id: patient.recovery_id,
        qr_token_hash: generated.hash,
        raw_token: rawToken,
        expires_at: expiry,
        is_active: true,
        created_at: new Date()
      };
      mockStore.recovery_passports.push(passport);
    } else {
      rawToken = passport.raw_token || 'CL_SECURE_TOKEN_REISSUED';
    }

    // Construct verification URL
    const verificationUrl = `${env.QR_BASE_URL}/${rawToken}`;

    // Generate QR Data URL
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#0f766e', // Teal healthcare brand color
        light: '#ffffff'
      }
    });

    return sendSuccess(res, {
      passport_id: passport.passport_id,
      recovery_id: patient.recovery_id,
      patient_id: patient.patient_id,
      qr_code: qrDataUrl,
      verification_url: verificationUrl,
      raw_token: rawToken,
      expires_at: passport.expires_at,
      is_active: passport.is_active
    }, 'Digital Recovery Passport generated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * Verify a scanned QR Token
 */
async function verifyPassport(req, res) {
  try {
    const { token } = req.params;
    if (!token) return sendError(res, 'Verification token required', 400);

    const tokenHash = hashToken(token);

    // Find matching passport
    const passport = mockStore.recovery_passports.find(
      rp => (rp.qr_token_hash === tokenHash || rp.raw_token === token) && rp.is_active
    );

    if (!passport) {
      return sendError(res, 'Invalid or deactivated Recovery Passport QR code', 404);
    }

    // Check expiry
    if (new Date(passport.expires_at) < new Date()) {
      return sendError(res, 'This Recovery Passport has expired. Please contact the hospital.', 410);
    }

    const patient = mockStore.patients.find(p => p.patient_id === passport.patient_id);
    const profile = mockStore.profiles.find(u => u.id === patient?.user_id) || {};
    const discharge = mockStore.discharges.find(d => d.patient_id === passport.patient_id);
    const upcomingApts = mockStore.appointments.filter(a => a.patient_id === passport.patient_id && a.status === 'Scheduled');

    // Return sanitized clinical verification details
    return sendSuccess(res, {
      verified: true,
      recovery_id: passport.recovery_id,
      patient_name: profile.full_name,
      gender: patient.gender,
      hospital: 'CareLoop Health City, Mysuru',
      discharge_date: discharge ? discharge.discharge_date : 'Under Active Inpatient Care',
      diagnosis: discharge ? discharge.diagnosis : 'Inpatient',
      emergency_contact: patient.emergency_contact,
      next_appointment: upcomingApts[0] ? `${upcomingApts[0].appointment_date} at ${upcomingApts[0].appointment_time}` : 'None scheduled',
      verified_at: new Date().toISOString()
    }, 'Recovery Passport verified successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * Get passport by patient ID
 */
async function getPassportByPatientId(req, res) {
  try {
    const { patientId } = req.params;
    const patient = mockStore.patients.find(p => p.patient_id === patientId || p.user_id === patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);

    return generatePassport({ params: { patientId: patient.patient_id } }, res);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * Revoke or Deactivate Passport
 */
async function revokePassport(req, res) {
  try {
    const { patientId } = req.params;
    const passports = mockStore.recovery_passports.filter(rp => rp.patient_id === patientId);
    passports.forEach(p => p.is_active = false);

    return sendSuccess(res, null, 'Recovery passport revoked successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  generatePassport,
  verifyPassport,
  getPassportByPatientId,
  revokePassport
};
