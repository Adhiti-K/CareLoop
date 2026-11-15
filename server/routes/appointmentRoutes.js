
const express = require('express');
const router = express.Router();

const {
  createAppointment,
  getAppointments,
  rescheduleAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');

const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');

router.use(authenticateToken);

router.get('/', getAppointments);

router.post(
  '/',
  authorizeRoles('Doctor', 'Nurse', 'Care Coordinator'),
  createAppointment
);

router.put(
  '/:id/reschedule',
  authorizeRoles('Doctor', 'Nurse', 'Care Coordinator'),
  rescheduleAppointment
);

router.put(
  '/:id/cancel',
  authorizeRoles('Doctor', 'Nurse', 'Care Coordinator'),
  cancelAppointment
);

module.exports = router;
