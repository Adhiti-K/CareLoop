const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllAppointments(req, res) {
  try {
    const user = req.user;
    let list = mockStore.appointments;

    // Filter appointments according to user role permissions
    if (user.role === 'patient') {
      const patient = mockStore.patients.find(p => p.user_id === user.id);
      list = patient ? list.filter(a => a.patient_id === patient.patient_id) : [];
    } else if (user.role === 'caregiver') {
      const accessList = mockStore.caregiver_access.filter(ca => ca.caregiver_user_id === user.id && ca.permission_status === 'Active');
      const authorizedPatientIds = accessList.map(ca => ca.patient_id);
      list = list.filter(a => authorizedPatientIds.includes(a.patient_id));
    } else if (user.role === 'doctor') {
      const doc = mockStore.doctors.find(d => d.user_id === user.id);
      if (doc) {
        list = list.filter(a => a.doctor_id === doc.doctor_id);
      }
    }

    // Enrich with patient and doctor names
    const enriched = list.map(a => {
      const pat = mockStore.patients.find(p => p.patient_id === a.patient_id) || {};
      const patProfile = mockStore.profiles.find(u => u.id === pat.user_id) || {};
      const doc = mockStore.doctors.find(d => d.doctor_id === a.doctor_id) || {};
      const docProfile = mockStore.profiles.find(u => u.id === doc.user_id) || {};

      return {
        ...a,
        patient_name: patProfile.full_name || 'Patient',
        recovery_id: pat.recovery_id || 'N/A',
        doctor_name: docProfile.full_name || 'Doctor',
        doctor_specialization: doc.specialization || 'Consultant'
      };
    });

    return sendSuccess(res, enriched);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    const apt = mockStore.appointments.find(a => a.appointment_id === id);
    if (!apt) return sendError(res, 'Appointment not found', 404);
    return sendSuccess(res, apt);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createAppointment(req, res) {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;
    
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return sendError(res, 'patient_id, doctor_id, appointment_date, and appointment_time are required', 400);
    }

    const newAppointment = {
      appointment_id: `apt-${Date.now()}`,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason: reason || 'Post-discharge follow-up',
      status: 'Scheduled',
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockStore.appointments.push(newAppointment);

    // Schedule automated appointment reminder record
    const reminderTime = new Date(`${appointment_date}T${appointment_time}`);
    reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours prior

    mockStore.appointment_reminders.push({
      reminder_id: `rem-${Date.now()}`,
      appointment_id: newAppointment.appointment_id,
      reminder_type: '24hr_prior',
      scheduled_at: reminderTime,
      delivery_status: 'pending',
      created_at: new Date()
    });

    // Notify patient
    const patient = mockStore.patients.find(p => p.patient_id === patient_id);
    if (patient) {
      mockStore.notifications.push({
        notification_id: `notif-${Date.now()}`,
        user_id: patient.user_id,
        title: 'New Follow-Up Appointment Scheduled',
        message: `Your follow-up appointment is confirmed for ${appointment_date} at ${appointment_time}.`,
        notification_type: 'appointment_scheduled',
        related_entity_id: newAppointment.appointment_id,
        is_read: false,
        created_at: new Date()
      });
    }

    return sendSuccess(res, newAppointment, 'Appointment scheduled successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.appointments.findIndex(a => a.appointment_id === id);
    if (idx === -1) return sendError(res, 'Appointment not found', 404);

    mockStore.appointments[idx] = {
      ...mockStore.appointments[idx],
      ...req.body,
      updated_at: new Date()
    };

    return sendSuccess(res, mockStore.appointments[idx], 'Appointment updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.appointments.findIndex(a => a.appointment_id === id);
    if (idx === -1) return sendError(res, 'Appointment not found', 404);

    mockStore.appointments[idx].status = 'Cancelled';
    return sendSuccess(res, mockStore.appointments[idx], 'Appointment cancelled successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
