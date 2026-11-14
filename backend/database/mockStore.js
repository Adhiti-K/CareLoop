// CareLoop In-Memory Mock Store for development, testing, and offline Supabase mode
// Ensures 100% of CRUD, QR, Auth, Reminders, and Document operations function seamlessly

const mockStore = {
  departments: [
    { department_id: 'dep-1', department_name: 'Cardiology', description: 'Post-cardiac rehab', created_at: new Date() },
    { department_id: 'dep-2', department_name: 'Orthopedics', description: 'Bone and joint care', created_at: new Date() },
    { department_id: 'dep-3', department_name: 'General Surgery', description: 'Post-operative recovery', created_at: new Date() },
    { department_id: 'dep-4', department_name: 'Internal Medicine', description: 'Chronic care management', created_at: new Date() }
  ],
  profiles: [
    { id: 'mock-admin-uuid', full_name: 'Administrator Sarah', email: 'admin@careloop.local', role: 'admin', status: 'active', phone: '+91 98888 11111' },
    { id: 'mock-doctor-uuid', full_name: 'Dr. Ramesh Kumar', email: 'doctor@careloop.local', role: 'doctor', status: 'active', phone: '+91 98888 22222' },
    { id: 'mock-nurse-uuid', full_name: 'Nurse Priya Sharma', email: 'nurse@careloop.local', role: 'nurse', status: 'active', phone: '+91 98888 33333' },
    { id: 'mock-receptionist-uuid', full_name: 'Receptionist Ananya', email: 'receptionist@careloop.local', role: 'receptionist', status: 'active', phone: '+91 98888 44444' },
    { id: 'mock-patient-uuid', full_name: 'Patient Rajesh Gowda', email: 'patient@careloop.local', role: 'patient', status: 'active', phone: '+91 98888 55555' },
    { id: 'mock-caregiver-uuid', full_name: 'Caregiver Meena Gowda', email: 'caregiver@careloop.local', role: 'caregiver', status: 'active', phone: '+91 98888 66666' }
  ],
  doctors: [
    { doctor_id: 'doc-1', user_id: 'mock-doctor-uuid', department_id: 'dep-1', specialization: 'Cardiology Specialist' }
  ],
  nurses: [
    { nurse_id: 'nur-1', user_id: 'mock-nurse-uuid', department_id: 'dep-1' }
  ],
  patients: [
    {
      patient_id: 'pat-1',
      user_id: 'mock-patient-uuid',
      recovery_id: 'CL-MYS-2026-00556',
      date_of_birth: '1982-06-15',
      gender: 'Male',
      address: 'No 45, Kuvempunagar, Mysuru, Karnataka',
      emergency_contact: '+91 98888 66666 (Meena Gowda, Spouse)',
      created_at: new Date('2026-02-10T10:00:00Z'),
      updated_at: new Date()
    }
  ],
  patient_assignments: [
    { assignment_id: 'asg-1', patient_id: 'pat-1', staff_user_id: 'mock-doctor-uuid', assigned_role: 'doctor', is_active: true },
    { assignment_id: 'asg-2', patient_id: 'pat-1', staff_user_id: 'mock-nurse-uuid', assigned_role: 'nurse', is_active: true }
  ],
  appointments: [
    {
      appointment_id: 'apt-1',
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      appointment_date: '2026-11-20',
      appointment_time: '10:30',
      reason: 'Post-discharge cardiac recovery review & ECG check',
      status: 'Scheduled',
      created_by: 'mock-doctor-uuid',
      created_at: new Date()
    },
    {
      appointment_id: 'apt-2',
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      appointment_date: '2026-11-05',
      appointment_time: '09:00',
      reason: 'Suture removal and initial wound inspection',
      status: 'Completed',
      created_by: 'mock-doctor-uuid',
      created_at: new Date()
    }
  ],
  appointment_reminders: [
    { reminder_id: 'rem-1', appointment_id: 'apt-1', reminder_type: '24hr_prior', scheduled_at: new Date('2026-11-19T10:30:00Z'), delivery_status: 'pending' }
  ],
  discharges: [
    {
      discharge_id: 'dis-1',
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      discharge_date: '2026-11-01',
      diagnosis: 'Acute Coronary Syndrome, Post-Angioplasty Stent Placement',
      medication_details: '1. Tab Aspirin 75mg once daily after lunch\n2. Tab Clopidogrel 75mg once daily\n3. Tab Atorvastatin 40mg at bedtime',
      instructions: 'Avoid strenuous exercises for 4 weeks. Measure BP daily morning and evening. Report chest tightness immediately.',
      follow_up_recommendation: 'Repeat 2D Echo in 3 weeks. Routine clinical follow up on 20th Nov.',
      created_at: new Date('2026-11-01T14:00:00Z')
    }
  ],
  recovery_passports: [
    {
      passport_id: 'pass-1',
      patient_id: 'pat-1',
      recovery_id: 'CL-MYS-2026-00556',
      qr_token_hash: 'mock-passport-token-hash-pat-1',
      raw_token: 'CL_TOKEN_PAT1_SECURE992837',
      expires_at: new Date('2027-11-01T00:00:00Z'),
      is_active: true,
      created_at: new Date()
    }
  ],
  notifications: [
    {
      notification_id: 'notif-1',
      user_id: 'mock-patient-uuid',
      title: 'Discharge Summary Issued',
      message: 'Your official CareLoop Digital Discharge Summary has been finalized by Dr. Ramesh Kumar.',
      notification_type: 'discharge',
      related_entity_id: 'dis-1',
      is_read: false,
      created_at: new Date()
    },
    {
      notification_id: 'notif-2',
      user_id: 'mock-patient-uuid',
      title: 'Upcoming Appointment Reminder',
      message: 'You have a scheduled follow-up on 2026-11-20 at 10:30 AM with Dr. Ramesh Kumar.',
      notification_type: 'appointment_reminder',
      related_entity_id: 'apt-1',
      is_read: false,
      created_at: new Date()
    }
  ],
  patient_queries: [
    {
      query_id: 'qry-1',
      patient_id: 'pat-1',
      assigned_to: 'mock-doctor-uuid',
      category: 'Medication',
      description: 'Experiencing mild dizziness in the morning after taking Atorvastatin. Should I change the timing?',
      response: 'Dizziness can happen during initial dose adjustments. Please take it right before bedtime with water. If it persists, visit outpatient.',
      status: 'Resolved',
      created_at: new Date('2026-11-03T09:30:00Z'),
      updated_at: new Date('2026-11-03T16:00:00Z')
    }
  ],
  query_history: [
    {
      history_id: 'qhist-1',
      query_id: 'qry-1',
      updated_by: 'mock-doctor-uuid',
      previous_status: 'Open',
      new_status: 'Resolved',
      response: 'Dizziness can happen during initial dose adjustments.',
      created_at: new Date('2026-11-03T16:00:00Z')
    }
  ],
  medical_documents: [
    {
      document_id: 'doc-item-1',
      patient_id: 'pat-1',
      uploaded_by: 'mock-doctor-uuid',
      document_name: 'Discharge_Card_ECG_Report.pdf',
      document_type: 'application/pdf',
      storage_path: 'patients/pat-1/Discharge_Card_ECG_Report.pdf',
      file_size: 245760,
      uploaded_at: new Date()
    }
  ],
  caregiver_access: [
    {
      access_id: 'cg-acc-1',
      patient_id: 'pat-1',
      caregiver_user_id: 'mock-caregiver-uuid',
      permission_status: 'Active',
      granted_at: new Date('2026-11-02T10:00:00Z'),
      revoked_at: null
    }
  ],
  caregiver_permissions: [
    {
      permission_id: 'cg-perm-1',
      access_id: 'cg-acc-1',
      can_view_discharge: true,
      can_view_appointments: true,
      can_view_documents: true,
      can_view_recovery_information: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  audit_logs: [
    {
      log_id: 'log-1',
      user_id: 'mock-doctor-uuid',
      action: 'CREATE_DISCHARGE',
      entity_type: 'discharge',
      entity_id: 'dis-1',
      created_at: new Date()
    }
  ]
};

module.exports = mockStore;
