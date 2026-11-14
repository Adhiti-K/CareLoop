const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function grantCaregiverAccess(req, res) {
  try {
    const { caregiver_email, can_view_discharge, can_view_appointments, can_view_documents } = req.body;
    
    // Find patient for this user
    const patient = mockStore.patients.find(p => p.user_id === req.user.id);
    if (!patient) {
      return sendError(res, 'Only registered patients can grant caregiver permissions', 403);
    }

    // Find caregiver user
    let caregiverProfile = mockStore.profiles.find(p => p.email.toLowerCase() === (caregiver_email || '').toLowerCase());
    if (!caregiverProfile) {
      // Auto-provision caregiver profile if new
      caregiverProfile = {
        id: `usr-cg-${Date.now()}`,
        email: caregiver_email,
        full_name: 'Authorized Caregiver',
        role: 'caregiver',
        status: 'active',
        created_at: new Date()
      };
      mockStore.profiles.push(caregiverProfile);
    }

    const accessId = `cg-acc-${Date.now()}`;
    const newAccess = {
      access_id: accessId,
      patient_id: patient.patient_id,
      caregiver_user_id: caregiverProfile.id,
      permission_status: 'Active',
      granted_at: new Date(),
      revoked_at: null
    };
    mockStore.caregiver_access.push(newAccess);

    mockStore.caregiver_permissions.push({
      permission_id: `cg-perm-${Date.now()}`,
      access_id: accessId,
      can_view_discharge: can_view_discharge ?? true,
      can_view_appointments: can_view_appointments ?? true,
      can_view_documents: can_view_documents ?? false,
      can_view_recovery_information: true,
      created_at: new Date()
    });

    return sendSuccess(res, newAccess, 'Caregiver authorization granted successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getAuthorizedPatients(req, res) {
  try {
    const accessList = mockStore.caregiver_access.filter(
      ca => ca.caregiver_user_id === req.user.id && ca.permission_status === 'Active'
    );

    const results = accessList.map(ca => {
      const patient = mockStore.patients.find(p => p.patient_id === ca.patient_id) || {};
      const profile = mockStore.profiles.find(u => u.id === patient.user_id) || {};
      const discharge = mockStore.discharges.find(d => d.patient_id === patient.patient_id);
      const permissions = mockStore.caregiver_permissions.find(cp => cp.access_id === ca.access_id) || {};

      return {
        access_id: ca.access_id,
        patient_id: patient.patient_id,
        recovery_id: patient.recovery_id,
        patient_name: profile.full_name,
        emergency_contact: patient.emergency_contact,
        discharge,
        permissions
      };
    });

    return sendSuccess(res, results);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function revokeCaregiverAccess(req, res) {
  try {
    const { id } = req.params;
    const access = mockStore.caregiver_access.find(ca => ca.access_id === id);
    if (!access) return sendError(res, 'Access record not found', 404);

    access.permission_status = 'Revoked';
    access.revoked_at = new Date();

    return sendSuccess(res, access, 'Caregiver authorization revoked');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  grantCaregiverAccess,
  getAuthorizedPatients,
  revokeCaregiverAccess
};
