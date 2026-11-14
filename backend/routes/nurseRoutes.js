const express = require('express');
const router = express.Router();
const nurseController = require('../controllers/nurseController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', nurseController.getAllNurses);
router.get('/:id', nurseController.getNurseById);

module.exports = router;
