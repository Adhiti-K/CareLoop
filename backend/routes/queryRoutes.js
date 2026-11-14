const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', queryController.getAllQueries);
router.get('/:id', queryController.getQueryById);
router.post('/', authorizeRoles('patient', 'caregiver', 'admin'), queryController.createQuery);
router.put('/:id', queryController.updateQuery);
router.put('/:id/resolve', authorizeRoles('doctor', 'nurse', 'admin'), queryController.resolveQuery);

module.exports = router;
