const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllDepartments(req, res) {
  try {
    return sendSuccess(res, mockStore.departments);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createDepartment(req, res) {
  try {
    const { department_name, description } = req.body;
    if (!department_name) return sendError(res, 'department_name is required', 400);

    const newDept = {
      department_id: `dep-${Date.now()}`,
      department_name,
      description: description || '',
      created_at: new Date()
    };
    mockStore.departments.push(newDept);
    return sendSuccess(res, newDept, 'Department created', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.departments.findIndex(d => d.department_id === id);
    if (idx === -1) return sendError(res, 'Department not found', 404);

    mockStore.departments[idx] = {
      ...mockStore.departments[idx],
      ...req.body
    };
    return sendSuccess(res, mockStore.departments[idx], 'Department updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    mockStore.departments = mockStore.departments.filter(d => d.department_id !== id);
    return sendSuccess(res, null, 'Department deleted');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
