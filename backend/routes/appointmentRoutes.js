const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', appointmentController.getAllAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', authorizeRoles('admin', 'receptionist', 'doctor'), appointmentController.createAppointment);
router.put('/:id', authorizeRoles('admin', 'receptionist', 'doctor'), appointmentController.updateAppointment);
router.delete('/:id', authorizeRoles('admin', 'receptionist', 'doctor', 'patient'), appointmentController.deleteAppointment);

module.exports = router;
