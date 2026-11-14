const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/:patientId', documentController.getDocumentsByPatientId);
router.post('/upload', documentController.uploadDocument);
router.get('/:id/download', documentController.getDownloadUrl);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
