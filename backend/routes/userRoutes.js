const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', authorizeRoles('admin', 'receptionist', 'doctor'), userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', authorizeRoles('admin'), userController.createUser);
router.put('/:id', authorizeRoles('admin'), userController.updateUser);
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

module.exports = router;
