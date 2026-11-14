const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllDoctors(req, res) {
  try {
    const list = mockStore.doctors.map(d => {
      const profile = mockStore.profiles.find(u => u.id === d.user_id) || {};
      const dept = mockStore.departments.find(dp => dp.department_id === d.department_id) || {};
      return {
        ...d,
        full_name: profile.full_name || 'Dr. Specialist',
        email: profile.email,
        phone: profile.phone,
        department_name: dept.department_name || 'General Medicine'
      };
    });
    return sendSuccess(res, list);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const doc = mockStore.doctors.find(d => d.doctor_id === id || d.user_id === id);
    if (!doc) return sendError(res, 'Doctor not found', 404);

    const profile = mockStore.profiles.find(u => u.id === doc.user_id) || {};
    const dept = mockStore.departments.find(dp => dp.department_id === doc.department_id) || {};
    
    return sendSuccess(res, {
      ...doc,
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
  getAllDoctors,
  getDoctorById
};
