const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', authorizeRoles('admin', 'receptionist', 'doctor'), patientController.createPatient);
router.put('/:id', authorizeRoles('admin', 'receptionist', 'doctor'), patientController.updatePatient);

module.exports = router;
