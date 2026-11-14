const express = require('express');
const router = express.Router();
const dischargeController = require('../controllers/dischargeController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/:patientId', dischargeController.getDischargeByPatientId);
router.post('/', authorizeRoles('admin', 'doctor'), dischargeController.createDischarge);
router.put('/:id', authorizeRoles('admin', 'doctor'), dischargeController.updateDischarge);

module.exports = router;
