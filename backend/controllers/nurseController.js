const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllNurses(req, res) {
  try {
    const list = mockStore.nurses.map(n => {
      const profile = mockStore.profiles.find(u => u.id === n.user_id) || {};
      const dept = mockStore.departments.find(dp => dp.department_id === n.department_id) || {};
      return {
        ...n,
        full_name: profile.full_name || 'Staff Nurse',
        email: profile.email,
        phone: profile.phone,
        department_name: dept.department_name || 'Inpatient Care'
      };
    });
    return sendSuccess(res, list);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getNurseById(req, res) {
  try {
    const { id } = req.params;
    const nurse = mockStore.nurses.find(n => n.nurse_id === id || n.user_id === id);
    if (!nurse) return sendError(res, 'Nurse not found', 404);

    const profile = mockStore.profiles.find(u => u.id === nurse.user_id) || {};
    const dept = mockStore.departments.find(dp => dp.department_id === nurse.department_id) || {};
    
    return sendSuccess(res, {
      ...nurse,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      department_name: dept.department_name
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getAllNurses,
  getNurseById
};
