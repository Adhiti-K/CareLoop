const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { generateRecoveryId } = require('../utils/recoveryIdGenerator');

/**
 * Register a user (Patient or Staff by controlled flows)
 */
async function register(req, res) {
  try {
    const { email, password, full_name, role = 'patient', phone, department_id } = req.body;

    if (!email || !full_name) {
      return sendError(res, 'Email and full_name are required', 400);
    }

    // Role safety check: Public self-registration only allows 'patient' or 'caregiver'
    const allowedSelfRoles = ['patient', 'caregiver'];
    if (!allowedSelfRoles.includes(role)) {
      // If registering doctor/nurse/receptionist/admin, require admin authorization or controlled registration
      if (!req.user || req.user.role !== 'admin') {
        return sendError(res, 'Privileged staff accounts must be provisioned by Administrator', 403);
      }
    }

    const existing = mockStore.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    const newUserId = `usr-${Date.now()}`;
    const newProfile = {
      id: newUserId,
      email,
      full_name,
      phone: phone || '',
      role,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockStore.profiles.push(newProfile);

    // If patient, create patient record and auto-assign Recovery ID
    if (role === 'patient') {
      const newPatientId = `pat-${Date.now()}`;
      const recoveryId = generateRecoveryId();
      mockStore.patients.push({
        patient_id: newPatientId,
        user_id: newUserId,
        recovery_id: recoveryId,
        date_of_birth: req.body.date_of_birth || null,
        gender: req.body.gender || 'Other',
        address: req.body.address || '',
        emergency_contact: req.body.emergency_contact || '',
        created_at: new Date(),
        updated_at: new Date()
      });
    } else if (role === 'doctor') {
      mockStore.doctors.push({
        doctor_id: `doc-${Date.now()}`,
        user_id: newUserId,
        department_id: department_id || mockStore.departments[0].department_id,
        specialization: req.body.specialization || 'General Care',
        created_at: new Date()
      });
    } else if (role === 'nurse') {
      mockStore.nurses.push({
        nurse_id: `nur-${Date.now()}`,
        user_id: newUserId,
        department_id: department_id || mockStore.departments[0].department_id,
        created_at: new Date()
      });
    }

    return sendSuccess(res, {
      user: newProfile,
      token: `mock-token-${role}`
    }, 'Account registered successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email) {
      return sendError(res, 'Email is required', 400);
    }

    // Match profile
    const profile = mockStore.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      return sendError(res, 'Invalid credentials. User not found.', 401);
    }

    if (profile.status === 'suspended') {
      return sendError(res, 'Your account is suspended. Contact administration.', 403);
    }

    // Return authenticated session token
    const token = `mock-token-${profile.role}`;

    // Get additional context depending on role
    let roleData = {};
    if (profile.role === 'patient') {
      roleData = mockStore.patients.find(p => p.user_id === profile.id) || {};
    } else if (profile.role === 'doctor') {
      roleData = mockStore.doctors.find(d => d.user_id === profile.id) || {};
    } else if (profile.role === 'nurse') {
      roleData = mockStore.nurses.find(n => n.user_id === profile.id) || {};
    }

    return sendSuccess(res, {
      user: profile,
      roleData,
      token
    }, 'Login successful');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * Get current session user profile
 */
async function getMe(req, res) {
  try {
    const user = req.user;
    let extra = {};
    if (user.role === 'patient') {
      extra = mockStore.patients.find(p => p.user_id === user.id) || {};
    } else if (user.role === 'doctor') {
      extra = mockStore.doctors.find(d => d.user_id === user.id) || {};
    } else if (user.role === 'nurse') {
      extra = mockStore.nurses.find(n => n.user_id === user.id) || {};
    }

    return sendSuccess(res, {
      user,
      extra
    }, 'User profile retrieved');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * Logout
 */
async function logout(req, res) {
  return sendSuccess(res, null, 'Logged out successfully');
}

module.exports = {
  register,
  login,
  getMe,
  logout
};
