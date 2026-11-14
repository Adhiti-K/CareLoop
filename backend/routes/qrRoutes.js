const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticate } = require('../middleware/authMiddleware');

// Verification endpoint is public or token-based to allow hospital emergency triage & scanning
router.get('/verify/:token', qrController.verifyPassport);

// Authenticated passport endpoints
router.post('/generate/:patientId', authenticate, qrController.generatePassport);
router.get('/passport/:patientId', authenticate, qrController.getPassportByPatientId);
router.post('/revoke/:patientId', authenticate, qrController.revokePassport);

module.exports = router;
