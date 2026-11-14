const cron = require('node-cron');
const mockStore = require('../database/mockStore');

/**
 * Evaluates pending appointments and sends notifications 24 hours prior
 * Runs every minute or hourly
 */
function initReminderJob() {
  cron.schedule('*/5 * * * *', () => {
    try {
      const now = new Date();
      const upcomingThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // within 24 hours

      mockStore.appointment_reminders.forEach(reminder => {
        if (reminder.delivery_status === 'pending') {
          const apt = mockStore.appointments.find(a => a.appointment_id === reminder.appointment_id);
          if (apt && apt.status === 'Scheduled') {
            const aptTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
            if (aptTime <= upcomingThreshold && aptTime > now) {
              // Dispatch notification
              const patient = mockStore.patients.find(p => p.patient_id === apt.patient_id);
              if (patient) {
                mockStore.notifications.push({
                  notification_id: `notif-rem-${Date.now()}`,
                  user_id: patient.user_id,
                  title: 'Reminder: Upcoming Follow-up Appointment',
                  message: `You have an appointment on ${apt.appointment_date} at ${apt.appointment_time}. Reason: ${apt.reason}`,
                  notification_type: 'appointment_reminder',
                  related_entity_id: apt.appointment_id,
                  is_read: false,
                  created_at: new Date()
                });
              }

              reminder.delivery_status = 'sent';
              reminder.sent_at = new Date();
              console.log(`[Cron Job] Dispatched appointment reminder for Appointment ID: ${apt.appointment_id}`);
            }
          }
        }
      });
    } catch (err) {
      console.error('[Reminder Job Error]:', err.message);
    }
  });
}

module.exports = {
  initReminderJob
};
