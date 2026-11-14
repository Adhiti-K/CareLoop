/**
 * CARELOOP Phase 3 Verification Test Suite (With Security Hardening):
 * Digital Discharge and Caregiver Handover
 *
 * Developer: Inchara - Backend Developer
 * For Rakshitha - Testing Team
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };

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
  console.log(' RUNNING CARELOOP PHASE 3 SECURITY & FUNCTIONAL TEST SUITE');
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

  // 1. Obtain Tokens
  console.log('--- Step 0: Authenticating Test Personas ---');
  const loginUser = async (email, password = 'Demo@1234') => {
    const res = await request('/api/auth/login', 'POST', { email, password });
    return res.data?.token;
  };

  const doctorToken = await loginUser('doctor.sarah@careloop.demo');
  const nurseToken = await loginUser('nurse.priya@careloop.demo');
  const coordToken = await loginUser('coordinator.anita@careloop.demo');
  const patientToken = await loginUser('patient.john@careloop.demo');
  const caregiverToken = await loginUser('caregiver.mary@careloop.demo');
  const adminToken = await loginUser('admin@careloop.demo');

  assert(doctorToken && nurseToken && patientToken && caregiverToken && adminToken, 'All test user tokens acquired');

  // -------------------------------------------------------------
  // SECTION 1: DISCHARGE CREATION & ROLE RESTRICTIONS
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Discharge Creation & Strict Role Boundaries ---');

  // Doctor creates discharge summary (Allowed)
  let testDischargeId = null;
  const createRes = await request('/api/discharge', 'POST', {
    patient_id: 1,
    admission_date: '2026-11-01',
    discharge_date: '2026-11-12',
    diagnosis: 'Acute Appendicitis - Post Laparoscopic Appendectomy',
    discharge_condition: 'Stable',
    medications_summary: 'Cefixime 200mg BID x 5 days; Paracetamol 650mg PRN',
    care_instructions: 'Keep incisions dry. Report fever > 100.4 F immediately.',
    emergency_contact_name: 'Mary Doe',
    emergency_contact_phone: '+91 9876543215',
    status: 'Draft'
  }, doctorToken);

  assert(
    createRes.status === 201 && createRes.data.success && createRes.data.discharge?.id,
    'Doctor successfully creates discharge summary (201 Created)',
    `Status: ${createRes.status}`
  );
  testDischargeId = createRes.data?.discharge?.id;

  // Nurse creates discharge summary (Allowed)
  const nurseCreateRes = await request('/api/discharge', 'POST', {
    patient_id: 1,
    admission_date: '2026-11-02',
    discharge_date: '2026-11-13',
    diagnosis: 'Dehydration & Electrolyte Imbalance',
    discharge_condition: 'Recovered',
    care_instructions: 'Oral rehydration therapy. Follow-up in 7 days.',
    status: 'Draft'
  }, nurseToken);

  assert(
    nurseCreateRes.status === 201 && nurseCreateRes.data.success,
    'Authorized Nurse successfully creates discharge summary (201 Created)',
    `Status: ${nurseCreateRes.status}`
  );

  // Security Correction 4: Admin MUST NOT create clinical discharge summaries
  const adminCreateRes = await request('/api/discharge', 'POST', {
    patient_id: 1,
    admission_date: '2026-11-01',
    discharge_date: '2026-11-12',
    diagnosis: 'Admin Unauthorized Attempt',
    care_instructions: 'None'
  }, adminToken);

  assert(
    adminCreateRes.status === 403 && !adminCreateRes.data.success,
    'Admin strictly PROHIBITED from creating clinical discharge summaries (403 Forbidden)',
    `Status: ${adminCreateRes.status}`
  );

  // Patient blocked from creating discharge summary
  const patientBlockedCreateRes = await request('/api/discharge', 'POST', {
    patient_id: 1,
    admission_date: '2026-11-01',
    discharge_date: '2026-11-12',
    diagnosis: 'Patient Unauthorized Attempt',
    care_instructions: 'None'
  }, patientToken);

  assert(
    patientBlockedCreateRes.status === 403,
    'Patient BLOCKED from creating discharge summary (403 Forbidden)',
    `Status: ${patientBlockedCreateRes.status}`
  );

  // -------------------------------------------------------------
  // SECTION 2: FINALIZED DISCHARGE SUMMARY LOCKING
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Finalized Discharge Record Immutability ---');

  // Doctor updates summary to 'Finalized'
  const finalizeRes = await request(`/api/discharge/${testDischargeId}`, 'PUT', {
    status: 'Finalized',
    care_instructions: 'Finalized care instructions. No further ordinary updates permitted.'
  }, doctorToken);

  assert(
    finalizeRes.status === 200 && finalizeRes.data.discharge?.status === 'Finalized',
    'Discharge summary successfully finalized by Doctor (200 OK)',
    `Status: ${finalizeRes.data?.discharge?.status}`
  );

  // Security Correction 3: Doctor attempts to modify finalized summary -> Blocked
  const doctorLockedUpdateRes = await request(`/api/discharge/${testDischargeId}`, 'PUT', {
    care_instructions: 'Attempted doctor modification to locked record.'
  }, doctorToken);

  assert(
    doctorLockedUpdateRes.status === 403 && !doctorLockedUpdateRes.data.success,
    'Doctor BLOCKED from modifying finalized discharge summary (403 Forbidden - Locked)',
    `Status: ${doctorLockedUpdateRes.status}, Message: ${doctorLockedUpdateRes.data?.message}`
  );

  // Security Correction 3: Admin attempts to modify finalized summary -> Blocked
  const adminLockedUpdateRes = await request(`/api/discharge/${testDischargeId}`, 'PUT', {
    care_instructions: 'Attempted admin modification to locked record.'
  }, adminToken);

  assert(
    adminLockedUpdateRes.status === 403 && !adminLockedUpdateRes.data.success,
    'Admin BLOCKED from modifying finalized discharge summary (403 Forbidden - Locked)',
    `Status: ${adminLockedUpdateRes.status}`
  );

  // Security Correction 3: Nurse attempts to modify finalized summary -> Blocked
  const nurseLockedUpdateRes = await request(`/api/discharge/${testDischargeId}`, 'PUT', {
    care_instructions: 'Attempted nurse modification to locked record.'
  }, nurseToken);

  assert(
    nurseLockedUpdateRes.status === 403 && !nurseLockedUpdateRes.data.success,
    'Nurse BLOCKED from modifying finalized discharge summary (403 Forbidden - Locked)',
    `Status: ${nurseLockedUpdateRes.status}`
  );

  // -------------------------------------------------------------
  // SECTION 3: CAREGIVER CONSENT (PENDING, DECLINED, ACKNOWLEDGED)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Caregiver Explicit Consent (Pending vs Acknowledged vs Declined) ---');

  // Create a secondary test patient & caregiver to isolate consent states cleanly
  const testPatient2Email = `patient.consent.${Date.now()}@careloop.demo`;
  const regPatient2 = await request('/api/auth/register', 'POST', {
    full_name: 'Consent Test Patient',
    email: testPatient2Email,
    password: 'SecurePass@123',
    role: 'Patient'
  });
  const patient2Id = regPatient2.data?.user?.patient_id;

  const testCaregiver2Email = `caregiver.consent.${Date.now()}@careloop.demo`;
  const regCaregiver2 = await request('/api/auth/register', 'POST', {
    full_name: 'Consent Test Caregiver',
    email: testCaregiver2Email,
    password: 'SecurePass@123',
    role: 'Caregiver',
    relationship_to_patient: 'Sibling'
  });
  const caregiver2Id = regCaregiver2.data?.user?.caregiver_id;
  const caregiver2Token = regCaregiver2.data?.token;

  // Doctor creates discharge summary for Patient 2
  const p2DischargeRes = await request('/api/discharge', 'POST', {
    patient_id: patient2Id,
    admission_date: '2026-11-05',
    discharge_date: '2026-11-14',
    diagnosis: 'Post-Op Knee Arthroscopy',
    care_instructions: 'Physical therapy exercises 2x daily.',
    status: 'Approved'
  }, doctorToken);
  const p2DischargeId = p2DischargeRes.data?.discharge?.id;

  // Assign Caregiver 2 to Patient 2 (Active mapping exists, but NO acknowledged handover yet)
  await request('/api/handover/assign', 'POST', {
    patient_id: patient2Id,
    caregiver_id: caregiver2Id,
    discharge_id: p2DischargeId,
    handover_notes: 'Initial handover pending caregiver acknowledgment.',
    care_responsibilities: 'Assist with knee icing and walking crutches.'
  }, doctorToken);

  // Fetch created handover ID
  const p2HandoversList = await request(`/api/handover/patient/${patient2Id}`, 'GET', null, doctorToken);
  const p2HandoverId = p2HandoversList.data?.handovers[0]?.id;

  // Security Correction 1: Caregiver 2 has active mapping BUT handover is 'Pending Acknowledgment' -> BLOCKED
  const pendingAccessRes = await request(`/api/discharge/patient/${patient2Id}`, 'GET', null, caregiver2Token);
  assert(
    pendingAccessRes.status === 403 && !pendingAccessRes.data.success,
    'Caregiver with PENDING handover is BLOCKED from clinical discharge summaries (403 Forbidden)',
    `Status: ${pendingAccessRes.status}, Message: ${pendingAccessRes.data?.message}`
  );

  // Security Correction 1: Caregiver 2 DECLINES the handover -> Still BLOCKED
  await request(`/api/handover/${p2HandoverId}/acknowledge`, 'POST', {
    status: 'Declined'
  }, caregiver2Token);

  const declinedAccessRes = await request(`/api/discharge/patient/${patient2Id}`, 'GET', null, caregiver2Token);
  assert(
    declinedAccessRes.status === 403 && !declinedAccessRes.data.success,
    'Caregiver with DECLINED handover is BLOCKED from clinical discharge summaries (403 Forbidden)',
    `Status: ${declinedAccessRes.status}`
  );

  // Doctor issues a second handover for Patient 2 & Caregiver 2
  const rehandoverRes = await request('/api/handover/assign', 'POST', {
    patient_id: patient2Id,
    caregiver_id: caregiver2Id,
    discharge_id: p2DischargeId,
    handover_notes: 'Revised care plan agreed upon with caregiver.',
    care_responsibilities: 'Supervise daily exercises.'
  }, doctorToken);
  const revisedHandoverId = rehandoverRes.data?.handover?.id;

  // Caregiver 2 explicitly ACKNOWLEDGES the revised handover with digital signature
  const ackSuccessRes = await request(`/api/handover/${revisedHandoverId}/acknowledge`, 'POST', {
    status: 'Acknowledged',
    caregiver_signature_name: 'Consent Test Caregiver'
  }, caregiver2Token);

  assert(
    ackSuccessRes.status === 200 && ackSuccessRes.data.handover?.status === 'Acknowledged',
    'Caregiver explicitly ACKNOWLEDGES handover with signature (200 OK)',
    `Status: ${ackSuccessRes.data?.handover?.status}`
  );

  // Security Correction 1: Now that handover is Acknowledged, Caregiver 2 is GRANTED access!
  const ackAccessRes = await request(`/api/discharge/patient/${patient2Id}`, 'GET', null, caregiver2Token);
  assert(
    ackAccessRes.status === 200 && ackAccessRes.data.discharges.length > 0,
    'Caregiver with ACKNOWLEDGED handover successfully accesses clinical discharge summaries (200 OK)',
    `Discharges returned: ${ackAccessRes.data?.discharges?.length}`
  );

  // -------------------------------------------------------------
  // SECTION 4: REVOKED CAREGIVER CANNOT ACKNOWLEDGE HANDOVERS
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Revoked Caregiver Acknowledgment Block ---');

  // Create another pending handover for Patient 2 & Caregiver 2
  const pendingRevokeH = await request('/api/handover/assign', 'POST', {
    patient_id: patient2Id,
    caregiver_id: caregiver2Id,
    discharge_id: p2DischargeId,
    handover_notes: 'Handover issued before relationship revocation.',
    care_responsibilities: 'Temporary task.'
  }, doctorToken);
  const pendingRevokeHId = pendingRevokeH.data?.handover?.id;

  // Patient 2 revokes Caregiver 2 access
  const revokeP2Res = await request('/api/handover/revoke', 'POST', {
    patient_id: patient2Id,
    caregiver_id: caregiver2Id
  }, doctorToken);

  assert(
    revokeP2Res.status === 200 && revokeP2Res.data.success,
    'Patient-Caregiver relationship revoked (200 OK)',
    `Status: ${revokeP2Res.status}`
  );

  // Security Correction 2: Revoked caregiver attempts to acknowledge the historical pending handover -> BLOCKED
  const revokedAckAttemptRes = await request(`/api/handover/${pendingRevokeHId}/acknowledge`, 'POST', {
    status: 'Acknowledged',
    caregiver_signature_name: 'Consent Test Caregiver'
  }, caregiver2Token);

  assert(
    revokedAckAttemptRes.status === 403 && !revokedAckAttemptRes.data.success,
    'Revoked caregiver BLOCKED from acknowledging historical handovers (403 Forbidden)',
    `Status: ${revokedAckAttemptRes.status}, Message: ${revokedAckAttemptRes.data?.message}`
  );

  // Revoked caregiver attempting to view discharge summaries -> BLOCKED
  const revokedViewAttemptRes = await request(`/api/discharge/patient/${patient2Id}`, 'GET', null, caregiver2Token);
  assert(
    revokedViewAttemptRes.status === 403 && !revokedViewAttemptRes.data.success,
    'Revoked caregiver BLOCKED from viewing discharge summaries (403 Forbidden)',
    `Status: ${revokedViewAttemptRes.status}`
  );

  // -------------------------------------------------------------
  // SECTION 5: REGRESSION VERIFICATION (PATIENT, PHASE 1 & PHASE 2)
  // -------------------------------------------------------------
  console.log('\n--- 5. Regression Verification ---');

  // Patient John views their own discharge records
  const patientViewRes = await request('/api/discharge/patient/1', 'GET', null, patientToken);
  assert(
    patientViewRes.status === 200 && patientViewRes.data.discharges.length > 0,
    'Patient views their own discharge summaries (200 OK)',
    `Count: ${patientViewRes.data?.count}`
  );

  // Patient John blocked from viewing Patient 2 records
  const patientBlockedOtherRes = await request(`/api/discharge/patient/${patient2Id}`, 'GET', null, patientToken);
  assert(
    patientBlockedOtherRes.status === 403,
    'Patient BLOCKED from viewing other patient records (403 Forbidden)',
    `Status: ${patientBlockedOtherRes.status}`
  );

  // Phase 1 Health check
  const healthRes = await request('/api/health', 'GET');
  assert(
    healthRes.status === 200 && healthRes.data.database?.connected,
    'Phase 1 Health check healthy and database connected (200 OK)',
    `Status: ${healthRes.status}`
  );

  // Phase 2 Auth profile
  const meRes = await request('/api/auth/me', 'GET', null, patientToken);
  assert(
    meRes.status === 200 && meRes.data.user.email === 'patient.john@careloop.demo',
    'Phase 2 Auth /me intact (200 OK)',
    `Email: ${meRes.data?.user?.email}`
  );

  // -------------------------------------------------------------
  // SUMMARY
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
