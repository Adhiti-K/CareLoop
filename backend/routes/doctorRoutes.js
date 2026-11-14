const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
