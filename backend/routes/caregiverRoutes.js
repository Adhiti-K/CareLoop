const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.post('/grant-access', authorizeRoles('patient', 'admin'), caregiverController.grantCaregiverAccess);
router.get('/authorized-patients', authorizeRoles('caregiver', 'admin'), caregiverController.getAuthorizedPatients);
router.delete('/revoke-access/:id', authorizeRoles('patient', 'admin'), caregiverController.revokeCaregiverAccess);

module.exports = router;
