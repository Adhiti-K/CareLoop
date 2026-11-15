/**
 * CARELOOP Phase 2 Verification Test Suite
 * Developer: Inchara - Backend Developer
 * Tester Readiness: For Rakshitha - Testing Team
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = data ? JSON.stringify(data) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = { raw: body };
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('================================================================');
  console.log(' RUNNING CARELOOP PHASE 2: AUTHENTICATION & RBAC TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description, detail = '') => {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description} -> ${detail}`);
      failed++;
    }
  };

  // -------------------------------------------------------------
  // Test 1: Successful Login for all 6 roles
  // -------------------------------------------------------------
  console.log('--- 1. Testing Successful Login Across All 6 Roles ---');
  const demoUsers = [
    { role: 'Admin', email: 'admin@careloop.demo', password: 'Demo@1234' },
    { role: 'Doctor', email: 'doctor.sarah@careloop.demo', password: 'Demo@1234' },
    { role: 'Nurse', email: 'nurse.priya@careloop.demo', password: 'Demo@1234' },
    { role: 'Care Coordinator', email: 'coordinator.anita@careloop.demo', password: 'Demo@1234' },
    { role: 'Patient', email: 'patient.john@careloop.demo', password: 'Demo@1234' },
    { role: 'Caregiver', email: 'caregiver.mary@careloop.demo', password: 'Demo@1234' }
  ];

  const tokens = {};

  for (const user of demoUsers) {
    const res = await request('/api/auth/login', 'POST', {
      email: user.email,
      password: user.password
    });

    assert(
      res.status === 200 && res.data.success && res.data.token && res.data.user.role === user.role,
      `Login for role '${user.role}' (${user.email})`,
      `Status: ${res.status}, Message: ${JSON.stringify(res.data)}`
    );

    if (res.data.token) {
      tokens[user.role] = res.data.token;
    }
  }

  // -------------------------------------------------------------
  // Test 2: Invalid Login Tests
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Invalid Login Scenarios ---');
  
  // Wrong password
  const badPassRes = await request('/api/auth/login', 'POST', {
    email: 'admin@careloop.demo',
    password: 'WrongPassword@999'
  });
  assert(
    badPassRes.status === 401 && !badPassRes.data.success,
    'Rejection of invalid password (401 Unauthorized)',
    `Status: ${badPassRes.status}`
  );

  // Non-existent user
  const badUserRes = await request('/api/auth/login', 'POST', {
    email: 'unknown.user@careloop.demo',
    password: 'Demo@1234'
  });
  assert(
    badUserRes.status === 401 && !badUserRes.data.success,
    'Rejection of non-existent email (401 Unauthorized)',
    `Status: ${badUserRes.status}`
  );

  // Missing fields
  const missingFieldRes = await request('/api/auth/login', 'POST', {
    email: 'admin@careloop.demo'
  });
  assert(
    missingFieldRes.status === 400 && !missingFieldRes.data.success,
    'Rejection when missing password (400 Bad Request)',
    `Status: ${missingFieldRes.status}`
  );

  // -------------------------------------------------------------
  // Test 3: Registration Validation
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Registration and Validation ---');
  
  const testPatientEmail = `test.patient.${Date.now()}@careloop.demo`;
  const regRes = await request('/api/auth/register', 'POST', {
    full_name: 'Test Patient Alice',
    email: testPatientEmail,
    password: 'SecurePass@123',
    role: 'Patient',
    phone: '+91 9988776655',
    date_of_birth: '1992-04-10',
    gender: 'Female',
    blood_group: 'B+',
    address: '12 Health Way, Bangalore'
  });

  assert(
    regRes.status === 201 && regRes.data.success && regRes.data.user.patient_id,
    'Successful Patient registration with auto profile creation',
    `Status: ${regRes.status}, PatientID: ${regRes.data?.user?.patient_id}`
  );

  // Duplicate email check
  const dupRes = await request('/api/auth/register', 'POST', {
    full_name: 'Duplicate Admin',
    email: 'admin@careloop.demo',
    password: 'SecurePass@123',
    role: 'Admin'
  });
  assert(
    dupRes.status === 409 && !dupRes.data.success,
    'Rejection of duplicate email (409 Conflict)',
    `Status: ${dupRes.status}`
  );

  // Weak password check
  const weakPassRes = await request('/api/auth/register', 'POST', {
    full_name: 'Weak Pass User',
    email: 'weakpass@careloop.demo',
    password: 'short',
    role: 'Patient'
  });
  assert(
    weakPassRes.status === 400 && !weakPassRes.data.success,
    'Rejection of short/weak password (400 Bad Request)',
    `Status: ${weakPassRes.status}`
  );

  // -------------------------------------------------------------
  // Test 4: Token Validation & GET /api/auth/me
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Token Validation & GET /api/auth/me ---');

  // Valid Token Patient
  const mePatientRes = await request('/api/auth/me', 'GET', null, tokens['Patient']);
  assert(
    mePatientRes.status === 200 && mePatientRes.data.user.role === 'Patient' && mePatientRes.data.user.patient_profile,
    'GET /api/auth/me for Patient returns user & patient profile',
    `Status: ${mePatientRes.status}`
  );

  // Valid Token Caregiver
  const meCaregiverRes = await request('/api/auth/me', 'GET', null, tokens['Caregiver']);
  assert(
    meCaregiverRes.status === 200 && meCaregiverRes.data.user.role === 'Caregiver' && meCaregiverRes.data.user.caregiver_profile,
    'GET /api/auth/me for Caregiver returns user & linked patients',
    `Status: ${meCaregiverRes.status}`
  );

  // Missing Token
  const noTokenRes = await request('/api/auth/me', 'GET');
  assert(
    noTokenRes.status === 401 && !noTokenRes.data.success,
    'GET /api/auth/me without token rejected (401 Unauthorized)',
    `Status: ${noTokenRes.status}`
  );

  // Tampered/Invalid Token
  const badTokenRes = await request('/api/auth/me', 'GET', null, 'invalid.token.payload');
  assert(
    badTokenRes.status === 403 && !badTokenRes.data.success,
    'GET /api/auth/me with invalid signature rejected (403 Forbidden)',
    `Status: ${badTokenRes.status}`
  );

  // -------------------------------------------------------------
  // Test 5: Role-Based Authorization Restrictions (RBAC)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Role-Based Authorization Restrictions (RBAC) ---');

  // Admin access to admin-only endpoint
  const adminAccessRes = await request('/api/auth/test/admin-only', 'GET', null, tokens['Admin']);
  assert(
    adminAccessRes.status === 200 && adminAccessRes.data.success,
    'Admin access to /test/admin-only (200 OK)',
    `Status: ${adminAccessRes.status}`
  );

  // Doctor blocked from admin-only endpoint
  const docBlockedRes = await request('/api/auth/test/admin-only', 'GET', null, tokens['Doctor']);
  assert(
    docBlockedRes.status === 403 && !docBlockedRes.data.success,
    'Doctor blocked from /test/admin-only (403 Forbidden)',
    `Status: ${docBlockedRes.status}`
  );

  // Patient blocked from admin-only endpoint
  const patientBlockedRes = await request('/api/auth/test/admin-only', 'GET', null, tokens['Patient']);
  assert(
    patientBlockedRes.status === 403 && !patientBlockedRes.data.success,
    'Patient blocked from /test/admin-only (403 Forbidden)',
    `Status: ${patientBlockedRes.status}`
  );

  // Clinical endpoint: Doctor allowed
  const docClinicalRes = await request('/api/auth/test/clinical', 'GET', null, tokens['Doctor']);
  assert(
    docClinicalRes.status === 200 && docClinicalRes.data.success,
    'Doctor access to /test/clinical (200 OK)',
    `Status: ${docClinicalRes.status}`
  );

  // Clinical endpoint: Nurse allowed
  const nurseClinicalRes = await request('/api/auth/test/clinical', 'GET', null, tokens['Nurse']);
  assert(
    nurseClinicalRes.status === 200 && nurseClinicalRes.data.success,
    'Nurse access to /test/clinical (200 OK)',
    `Status: ${nurseClinicalRes.status}`
  );

  // Clinical endpoint: Care Coordinator blocked
  const coordBlockedClinicalRes = await request('/api/auth/test/clinical', 'GET', null, tokens['Care Coordinator']);
  assert(
    coordBlockedClinicalRes.status === 403 && !coordBlockedClinicalRes.data.success,
    'Care Coordinator blocked from /test/clinical (403 Forbidden)',
    `Status: ${coordBlockedClinicalRes.status}`
  );

  // Coordination endpoint: Care Coordinator allowed
  const coordAllowedRes = await request('/api/auth/test/coordination', 'GET', null, tokens['Care Coordinator']);
  assert(
    coordAllowedRes.status === 200 && coordAllowedRes.data.success,
    'Care Coordinator access to /test/coordination (200 OK)',
    `Status: ${coordAllowedRes.status}`
  );

  // Caregiver endpoint: Caregiver allowed
  const caregiverAllowedRes = await request('/api/auth/test/caregiver-only', 'GET', null, tokens['Caregiver']);
  assert(
    caregiverAllowedRes.status === 200 && caregiverAllowedRes.data.success,
    'Caregiver access to /test/caregiver-only (200 OK)',
    `Status: ${caregiverAllowedRes.status}`
  );

  // Caregiver endpoint: Patient blocked
  const patientBlockedCaregiverRes = await request('/api/auth/test/caregiver-only', 'GET', null, tokens['Patient']);
  assert(
    patientBlockedCaregiverRes.status === 403 && !patientBlockedCaregiverRes.data.success,
    'Patient blocked from /test/caregiver-only (403 Forbidden)',
    `Status: ${patientBlockedCaregiverRes.status}`
  );

  // -------------------------------------------------------------
  // Test 6: Patient Data Access Restrictions
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Patient Medical Data Isolation & Access Restrictions ---');

  // Patient John (ID=1) accessing Patient 1 data
  const patientOwnDataRes = await request('/api/auth/test/patient-data/1', 'GET', null, tokens['Patient']);
  assert(
    patientOwnDataRes.status === 200 && patientOwnDataRes.data.success,
    'Patient accessing their own medical data (200 OK)',
    `Status: ${patientOwnDataRes.status}`
  );

  // Patient John (ID=1) attempting to access Patient 99 data
  const patientOtherDataRes = await request('/api/auth/test/patient-data/99', 'GET', null, tokens['Patient']);
  assert(
    patientOtherDataRes.status === 403 && !patientOtherDataRes.data.success,
    'Patient BLOCKED from viewing other patient\'s medical data (403 Forbidden)',
    `Status: ${patientOtherDataRes.status}`
  );

  // Caregiver Mary (mapped to Patient 1) accessing Patient 1 data
  const caregiverMappedDataRes = await request('/api/auth/test/patient-data/1', 'GET', null, tokens['Caregiver']);
  assert(
    caregiverMappedDataRes.status === 200 && caregiverMappedDataRes.data.success,
    'Caregiver accessing mapped patient data (200 OK)',
    `Status: ${caregiverMappedDataRes.status}`
  );

  // Caregiver Mary attempting to access unmapped Patient 99 data
  const caregiverUnmappedDataRes = await request('/api/auth/test/patient-data/99', 'GET', null, tokens['Caregiver']);
  assert(
    caregiverUnmappedDataRes.status === 403 && !caregiverUnmappedDataRes.data.success,
    'Caregiver BLOCKED from unmapped patient medical data (403 Forbidden)',
    `Status: ${caregiverUnmappedDataRes.status}`
  );

  // Doctor Sarah accessing Patient 1 data (clinical privilege)
  const doctorPatientDataRes = await request('/api/auth/test/patient-data/1', 'GET', null, tokens['Doctor']);
  assert(
    doctorPatientDataRes.status === 200 && doctorPatientDataRes.data.success,
    'Doctor authorized to view patient medical data (200 OK)',
    `Status: ${doctorPatientDataRes.status}`
  );

  // Care Coordinator Anita accessing Patient 1 data (coordination privilege)
  const coordPatientDataRes = await request('/api/auth/test/patient-data/1', 'GET', null, tokens['Care Coordinator']);
  assert(
    coordPatientDataRes.status === 200 && coordPatientDataRes.data.success,
    'Care Coordinator authorized to view patient medical data (200 OK)',
    `Status: ${coordPatientDataRes.status}`
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
