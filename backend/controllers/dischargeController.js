const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getDischargeByPatientId(req, res) {
  try {
    const { patientId } = req.params;
    const discharge = mockStore.discharges.find(d => d.patient_id === patientId);
    if (!discharge) {
      return sendError(res, 'No discharge summary found for this patient', 404);
    }

    const doctor = mockStore.doctors.find(d => d.doctor_id === discharge.doctor_id) || {};
    const doctorProfile = mockStore.profiles.find(u => u.id === doctor.user_id) || {};

    return sendSuccess(res, {
      ...discharge,
      doctor_name: doctorProfile.full_name || 'Dr. Attending Physician',
      specialization: doctor.specialization || 'Consultant'
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createDischarge(req, res) {
  try {
    const { patient_id, doctor_id, discharge_date, diagnosis, medication_details, instructions, follow_up_recommendation } = req.body;

    if (!patient_id || !diagnosis || !medication_details || !instructions) {
      return sendError(res, 'patient_id, diagnosis, medication_details, and instructions are required', 400);
    }

    // Determine doctor_id from session if doctor
    let docId = doctor_id;
    if (req.user.role === 'doctor') {
      const doc = mockStore.doctors.find(d => d.user_id === req.user.id);
      if (doc) docId = doc.doctor_id;
    }

    const newDischarge = {
      discharge_id: `dis-${Date.now()}`,
      patient_id,
      doctor_id: docId || 'doc-1',
      discharge_date: discharge_date || new Date().toISOString().split('T')[0],
      diagnosis,
      medication_details,
      instructions,
      follow_up_recommendation: follow_up_recommendation || 'Follow up in 2 weeks',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockStore.discharges.push(newDischarge);

    // Notify patient
    const patient = mockStore.patients.find(p => p.patient_id === patient_id);
    if (patient) {
      mockStore.notifications.push({
        notification_id: `notif-${Date.now()}`,
        user_id: patient.user_id,
        title: 'Discharge Summary Finalized',
        message: 'Your official CareLoop Digital Discharge Summary and recovery care plan have been issued.',
        notification_type: 'discharge',
        related_entity_id: newDischarge.discharge_id,
        is_read: false,
        created_at: new Date()
      });
    }

    return sendSuccess(res, newDischarge, 'Discharge summary created successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function updateDischarge(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.discharges.findIndex(d => d.discharge_id === id);
    if (idx === -1) return sendError(res, 'Discharge record not found', 404);

    mockStore.discharges[idx] = {
      ...mockStore.discharges[idx],
      ...req.body,
      updated_at: new Date()
    };

    return sendSuccess(res, mockStore.discharges[idx], 'Discharge summary updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getDischargeByPatientId,
  createDischarge,
  updateDischarge
};
