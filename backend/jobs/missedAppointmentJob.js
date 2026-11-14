const cron = require('node-cron');
const mockStore = require('../database/mockStore');

/**
 * Detects appointments whose scheduled date/time has passed without completion
 * Automatically marks them as 'Missed' and notifies hospital staff and patient
 */
function initMissedAppointmentJob() {
  cron.schedule('*/10 * * * *', () => {
    try {
      const now = new Date();

      mockStore.appointments.forEach(apt => {
        if (apt.status === 'Scheduled') {
          const aptTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
          // If scheduled time has passed by more than 2 hours without check-in
          if (aptTime.getTime() + (2 * 60 * 60 * 1000) < now.getTime()) {
            apt.status = 'Missed';
            apt.updated_at = new Date();

            const patient = mockStore.patients.find(p => p.patient_id === apt.patient_id);
            if (patient) {
              mockStore.notifications.push({
                notification_id: `notif-missed-${Date.now()}`,
                user_id: patient.user_id,
                title: 'Missed Follow-Up Appointment Alert',
                message: `We noticed you missed your follow-up appointment scheduled for ${apt.appointment_date}. Please contact the reception to reschedule promptly for your safe recovery.`,
                notification_type: 'missed_appointment',
                related_entity_id: apt.appointment_id,
                is_read: false,
                created_at: new Date()
              });
            }

            console.log(`[Cron Job] Flagged Appointment ${apt.appointment_id} as Missed.`);
          }
        }
      });
    } catch (err) {
      console.error('[Missed Appointment Job Error]:', err.message);
    }
  });
}

module.exports = {
  initMissedAppointmentJob
};
