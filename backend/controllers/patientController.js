const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { generateRecoveryId } = require('../utils/recoveryIdGenerator');

async function getAllPatients(req, res) {
  try {
    const enriched = mockStore.patients.map(p => {
      const profile = mockStore.profiles.find(u => u.id === p.user_id) || {};
      const discharge = mockStore.discharges.find(d => d.patient_id === p.patient_id) || null;
      return {
        ...p,
        full_name: profile.full_name || 'Unknown Patient',
        email: profile.email || '',
        phone: profile.phone || '',
        is_discharged: !!discharge,
        discharge_summary: discharge
      };
    });
    return sendSuccess(res, enriched);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patient = mockStore.patients.find(p => p.patient_id === id || p.recovery_id === id || p.user_id === id);
    if (!patient) return sendError(res, 'Patient record not found', 404);

    const profile = mockStore.profiles.find(u => u.id === patient.user_id) || {};
    const discharge = mockStore.discharges.find(d => d.patient_id === patient.patient_id) || null;
    const appointments = mockStore.appointments.filter(a => a.patient_id === patient.patient_id);
    const documents = mockStore.medical_documents.filter(m => m.patient_id === patient.patient_id);
    const passport = mockStore.recovery_passports.find(rp => rp.patient_id === patient.patient_id);

    return sendSuccess(res, {
      ...patient,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      discharge,
      appointments,
      documents,
      passport
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createPatient(req, res) {
  try {
    const { full_name, email, phone, date_of_birth, gender, address, emergency_contact } = req.body;
    
    // Create linked profile
    const userId = `usr-pat-${Date.now()}`;
    const profile = {
      id: userId,
      full_name: full_name || 'New Patient',
      email: email || `patient_${Date.now()}@careloop.local`,
      phone: phone || '',
      role: 'patient',
      status: 'active',
      created_at: new Date()
    };
    mockStore.profiles.push(profile);

    const newPatient = {
      patient_id: `pat-${Date.now()}`,
      user_id: userId,
      recovery_id: generateRecoveryId(),
      date_of_birth: date_of_birth || null,
      gender: gender || 'Male',
      address: address || '',
      emergency_contact: emergency_contact || '',
      created_at: new Date(),
      updated_at: new Date()
    };
    mockStore.patients.push(newPatient);

    return sendSuccess(res, { ...newPatient, profile }, 'Patient registered successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function updatePatient(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.patients.findIndex(p => p.patient_id === id);
    if (idx === -1) return sendError(res, 'Patient not found', 404);

    mockStore.patients[idx] = {
      ...mockStore.patients[idx],
      ...req.body,
      updated_at: new Date()
    };

    return sendSuccess(res, mockStore.patients[idx], 'Patient record updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient
};
