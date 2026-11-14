const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', departmentController.getAllDepartments);
router.post('/', authorizeRoles('admin'), departmentController.createDepartment);
router.put('/:id', authorizeRoles('admin'), departmentController.updateDepartment);
router.delete('/:id', authorizeRoles('admin'), departmentController.deleteDepartment);

module.exports = router;
