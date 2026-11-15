
const { pool } = require('../config/db');

// --------------------------------------------------
// HELPER: Validate appointment date and time
// --------------------------------------------------
function isValidFutureAppointment(date, time) {
  if (
    typeof date !== 'string' ||
    typeof time !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}(:\d{2})?$/.test(time)
  ) {
    return false;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const seconds = Number(time.split(':')[2] || 0);

  const checkDate = new Date(Date.UTC(year, month - 1, day));

  if (
    checkDate.getUTCFullYear() !== year ||
    checkDate.getUTCMonth() !== month - 1 ||
    checkDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    seconds > 59
  ) {
    return false;
  }

  const appointmentDateTime = new Date(
    `${date}T${time.length === 5 ? `${time}:00` : time}`
  );

  return (
    !Number.isNaN(appointmentDateTime.getTime()) &&
    appointmentDateTime.getTime() > Date.now()
  );
}

// --------------------------------------------------
// HELPER: Check active caregiver mapping and consent
// --------------------------------------------------
async function hasCaregiverConsent(patientId, caregiverId) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM patient_caregiver_mappings pcm
     WHERE pcm.patient_id = ?
       AND pcm.caregiver_id = ?
       AND EXISTS (
         SELECT 1
         FROM caregiver_handovers ch
         JOIN discharge_summaries ds
           ON ds.id = ch.discharge_id
         WHERE ch.patient_id = pcm.patient_id
           AND ch.caregiver_id = pcm.caregiver_id
           AND ch.status = 'Acknowledged'
       )
     LIMIT 1`,
    [patientId, caregiverId]
  );

  return rows.length > 0;
}

// --------------------------------------------------
// CREATE APPOINTMENT
// --------------------------------------------------
const createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      nurse_id,
      appointment_date,
      appointment_time,
      reason,
      notes
    } = req.body;

    const role = req.user.role;
    const userId = req.user.id;

    if (
      !patient_id ||
      !appointment_date ||
      !appointment_time ||
      !reason ||
      typeof reason !== 'string' ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Patient, date, time and reason are required.'
      });
    }

    if (!Number.isInteger(Number(patient_id)) || Number(patient_id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID.'
      });
    }

    if (!isValidFutureAppointment(appointment_date, appointment_time)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid future appointment date and time.'
      });
    }

    const [patients] = await pool.query(
      'SELECT id FROM patients WHERE id = ?',
      [patient_id]
    );

    if (!patients.length) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    let assignedDoctor = doctor_id;
    let assignedNurse = nurse_id || null;
    let coordinatorId = null;

    if (role === 'Doctor') {
      assignedDoctor = userId;
    } else if (role === 'Nurse') {
      assignedNurse = userId;
    } else if (role === 'Care Coordinator') {
      coordinatorId = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create appointments.'
      });
    }

    if (
      !assignedDoctor ||
      !Number.isInteger(Number(assignedDoctor)) ||
      Number(assignedDoctor) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid doctor must be assigned.'
      });
    }

    const [doctors] = await pool.query(
      `SELECT id FROM users
       WHERE id = ? AND role = 'Doctor' AND is_active = 1`,
      [assignedDoctor]
    );

    if (!doctors.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive doctor.'
      });
    }

    if (assignedNurse !== null) {
      if (
        !Number.isInteger(Number(assignedNurse)) ||
        Number(assignedNurse) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid nurse ID.'
        });
      }

      const [nurses] = await pool.query(
        `SELECT id FROM users
         WHERE id = ? AND role = 'Nurse' AND is_active = 1`,
        [assignedNurse]
      );

      if (!nurses.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive nurse.'
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO appointments
       (
         patient_id,
         doctor_id,
         nurse_id,
         care_coordinator_id,
         appointment_date,
         appointment_time,
         reason,
         notes,
         status,
         reminder_sent,
         missed_alert_sent
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', 0, 0)`,
      [
        patient_id,
        assignedDoctor,
        assignedNurse,
        coordinatorId,
        appointment_date,
        appointment_time,
        reason.trim(),
        notes || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully.',
      appointment_id: result.insertId
    });

  } catch (error) {
    console.error('Create appointment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create appointment.'
    });
  }
};

// --------------------------------------------------
// VIEW APPOINTMENTS
// --------------------------------------------------
const getAppointments = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let query = `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.nurse_id,
        a.care_coordinator_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at,
        p.user_id AS patient_user_id,
        d.full_name AS doctor_name,
        n.full_name AS nurse_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN users n ON a.nurse_id = n.id
    `;

    const params = [];

    if (role === 'Patient') {
      if (!req.user.patient_id) {
        return res.status(403).json({
          success: false,
          message: 'Patient profile not found.'
        });
      }

      query += ' WHERE a.patient_id = ?';
      params.push(req.user.patient_id);

    } else if (role === 'Caregiver') {
      if (!req.user.caregiver_id) {
        return res.status(403).json({
          success: false,
          message: 'Caregiver profile not found.'
        });
      }

      query += `
        WHERE EXISTS (
          SELECT 1
          FROM patient_caregiver_mappings pcm
          WHERE pcm.patient_id = a.patient_id
            AND pcm.caregiver_id = ?
            AND EXISTS (
              SELECT 1
              FROM caregiver_handovers ch
              JOIN discharge_summaries ds
                ON ds.id = ch.discharge_id
              WHERE ch.patient_id = pcm.patient_id
                AND ch.caregiver_id = pcm.caregiver_id
                AND ch.status = 'Acknowledged'
            )
        )
      `;

      params.push(req.user.caregiver_id);

    } else if (role === 'Doctor') {
      query += ' WHERE a.doctor_id = ?';
      params.push(userId);

    } else if (role === 'Nurse') {
      query += ' WHERE a.nurse_id = ?';
      params.push(userId);

    } else if (role === 'Care Coordinator') {
      query += ' WHERE a.care_coordinator_id = ?';
      params.push(userId);

    } else if (role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

    const [appointments] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error('Get appointments error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.'
    });
  }
};

// --------------------------------------------------
// RESCHEDULE APPOINTMENT
// --------------------------------------------------
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;

    const role = req.user.role;
    const userId = req.user.id;

    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID.'
      });
    }

    if (!isValidFutureAppointment(appointment_date, appointment_time)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid future appointment date and time.'
      });
    }

    let assignmentColumn;

    if (role === 'Doctor') {
      assignmentColumn = 'doctor_id';
    } else if (role === 'Nurse') {
      assignmentColumn = 'nurse_id';
    } else if (role === 'Care Coordinator') {
      assignmentColumn = 'care_coordinator_id';
    } else {
      return res.status(403).json({
        success: false,
        message: 'You cannot reschedule appointments.'
      });
    }

    const [result] = await pool.query(
      `UPDATE appointments
       SET appointment_date = ?,
           appointment_time = ?,
           reminder_sent = 0,
           missed_alert_sent = 0
       WHERE id = ?
         AND ${assignmentColumn} = ?
         AND status = 'Scheduled'`,
      [appointment_date, appointment_time, id, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled appointment not found or not assigned to you.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.'
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment.'
    });
  }
};

// --------------------------------------------------
// CANCEL APPOINTMENT
// --------------------------------------------------
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const role = req.user.role;
    const userId = req.user.id;

    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID.'
      });
    }

    let assignmentColumn;

    if (role === 'Doctor') {
      assignmentColumn = 'doctor_id';
    } else if (role === 'Nurse') {
      assignmentColumn = 'nurse_id';
    } else if (role === 'Care Coordinator') {
      assignmentColumn = 'care_coordinator_id';
    } else {
      return res.status(403).json({
        success: false,
        message: 'You cannot cancel appointments.'
      });
    }

    const [result] = await pool.query(
      `UPDATE appointments
       SET status = 'Cancelled'
       WHERE id = ?
         AND ${assignmentColumn} = ?
         AND status = 'Scheduled'`,
      [id, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled appointment not found or not assigned to you.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment.'
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  rescheduleAppointment,
  cancelAppointment
};
