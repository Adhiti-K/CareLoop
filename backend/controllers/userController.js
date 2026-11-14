const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllUsers(req, res) {
  try {
    const roleFilter = req.query.role;
    let list = mockStore.profiles;
    if (roleFilter) {
      list = list.filter(u => u.role === roleFilter);
    }
    return sendSuccess(res, list);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = mockStore.profiles.find(u => u.id === id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createUser(req, res) {
  try {
    const { email, full_name, role, phone } = req.body;
    const newUser = {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role: role || 'patient',
      phone: phone || '',
      status: 'active',
      created_at: new Date()
    };
    mockStore.profiles.push(newUser);
    return sendSuccess(res, newUser, 'User created successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.profiles.findIndex(u => u.id === id);
    if (idx === -1) return sendError(res, 'User not found', 404);

    mockStore.profiles[idx] = {
      ...mockStore.profiles[idx],
      ...req.body,
      updated_at: new Date()
    };
    return sendSuccess(res, mockStore.profiles[idx], 'User updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    mockStore.profiles = mockStore.profiles.filter(u => u.id !== id);
    return sendSuccess(res, null, 'User deleted successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
