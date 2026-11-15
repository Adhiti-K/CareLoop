/**
 * CARELOOP Phase 4 Verification Test Suite:
 * QR-Based Digital Recovery Passport & Security Hardening
 *
 * Developer: Inchara - Backend Developer
 * For Rakshitha - Testing Team
 */

const http = require('http');
const crypto = require('crypto');

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
  console.log(' RUNNING CARELOOP PHASE 4: RECOVERY PASSPORT & QR SECURITY TEST');
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

  // 1. Authenticate Test Users
  console.log('--- Step 0: Authenticating Personas ---');
  const loginUser = async (email, password = 'Demo@1234') => {
    const res = await request('/api/auth/login', 'POST', { email, password });
    return res.data?.token;
  };

  const doctorToken = await loginUser('doctor.sarah@careloop.demo');
  const nurseToken = await loginUser('nurse.priya@careloop.demo');
  const patientToken = await loginUser('patient.john@careloop.demo');
  const caregiverToken = await loginUser('caregiver.mary@careloop.demo');
  const adminToken = await loginUser('admin@careloop.demo');

  assert(doctorToken && nurseToken && patientToken && caregiverToken && adminToken, 'All persona tokens acquired');

  // -------------------------------------------------------------
  // SECTION 1: QR PASSPORT GENERATION & ROLE RESTRICTIONS
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing QR Passport Generation & Role Restriction ---');

  // Doctor generates passport for Patient 1
  const gen1Res = await request('/api/passport/generate/1', 'POST', {
    recovery_status: 'In Recovery',
    expires_in_days: 180
  }, doctorToken);

  assert(
    gen1Res.status === 201 && gen1Res.data.success && gen1Res.data.passport?.qr_code_data_url,
    'Doctor successfully generates recovery passport & QR code (201 Created)',
    `Status: ${gen1Res.status}`
  );

  const verificationUrl1 = gen1Res.data?.passport?.verification_url;
  const rawToken1 = verificationUrl1 ? verificationUrl1.split('/').pop() : null;
  assert(rawToken1 && rawToken1.length === 64, 'Generated token is 256-bit cryptographically secure token (64 hex chars)');

  // Verify QR code starts with data URL image format
  assert(
    gen1Res.data?.passport?.qr_code_data_url.startsWith('data:image/png;base64,'),
    'QR code delivered as valid Base64 PNG Data URL'
  );

  // Nurse regenerates passport for Patient 1
  const gen2Res = await request('/api/passport/generate/1', 'POST', {
    recovery_status: 'Under Observation',
    expires_in_days: 90
  }, nurseToken);

  assert(
    gen2Res.status === 201 && gen2Res.data.success,
    'Authorized Nurse successfully regenerates recovery passport (201 Created)',
    `Status: ${gen2Res.status}`
  );

  const verificationUrl2 = gen2Res.data?.passport?.verification_url;
  const rawToken2 = verificationUrl2 ? verificationUrl2.split('/').pop() : null;

  // Security Check 4: Invalidation of Previous Token
  const oldVerifyRes = await request(`/api/passport/verify/${rawToken1}`, 'GET');
  assert(
    oldVerifyRes.status === 404 && !oldVerifyRes.data.valid,
    'Regeneration IMMEDIATELY INVALIDATES previous QR token (404 Not Found)',
    `Status: ${oldVerifyRes.status}, Message: ${oldVerifyRes.data?.message}`
  );

  // Unauthorized Generation: Admin Prohibited
  const adminGenRes = await request('/api/passport/generate/1', 'POST', {
    recovery_status: 'In Recovery'
  }, adminToken);

  assert(
    adminGenRes.status === 403,
    'Admin strictly PROHIBITED from generating recovery passports (403 Forbidden)',
    `Status: ${adminGenRes.status}`
  );

  // Unauthorized Generation: Patient Prohibited
  const patientGenRes = await request('/api/passport/generate/1', 'POST', {
    recovery_status: 'In Recovery'
  }, patientToken);

  assert(
    patientGenRes.status === 403,
    'Patient BLOCKED from generating own recovery passport (403 Forbidden)',
    `Status: ${patientGenRes.status}`
  );

  // -------------------------------------------------------------
  // SECTION 2: PUBLIC QR VERIFICATION & ZERO PHI ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Public QR Verification & Zero PHI Exposure ---');

  // Verify valid active token #2
  const verifyValidRes = await request(`/api/passport/verify/${rawToken2}`, 'GET');
  assert(
    verifyValidRes.status === 200 && verifyValidRes.data.valid && verifyValidRes.data.passport_status === 'Active',
    'Public QR verification succeeds for valid active token (200 OK)',
    `Status: ${verifyValidRes.status}`
  );

  // Security Check 3: ZERO PHI Exposed in public verification response
  const verifyData = verifyValidRes.data;
  const containsNoPHI = !verifyData.patient_name &&
                        !verifyData.diagnosis &&
                        !verifyData.medications &&
                        !verifyData.care_instructions &&
                        !verifyData.emergency_contact &&
                        !verifyData.address;

  assert(
    containsNoPHI,
    'ZERO sensitive PHI exposed in public QR verification (No name, diagnosis, medications or contacts)',
    `Keys returned: ${Object.keys(verifyData).join(', ')}`
  );

  // Invalid / Unknown Token Rejection
  const fakeToken = crypto.randomBytes(32).toString('hex');
  const fakeVerifyRes = await request(`/api/passport/verify/${fakeToken}`, 'GET');
  assert(
    fakeVerifyRes.status === 404 && !fakeVerifyRes.data.valid,
    'Unknown token rejected by public verifier (404 Not Found)',
    `Status: ${fakeVerifyRes.status}`
  );

  // Malformed Token Rejection
  const malformedVerifyRes = await request('/api/passport/verify/short', 'GET');
  assert(
    malformedVerifyRes.status === 404 && !malformedVerifyRes.data.valid,
    'Malformed/short token rejected (404 Not Found)',
    `Status: ${malformedVerifyRes.status}`
  );

  // -------------------------------------------------------------
  // SECTION 3: STATUS SUSPENSION & EXPIRATION REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Status Updates, Suspension & Expiration ---');

  // Doctor suspends passport
  const suspendRes = await request('/api/passport/status/1', 'PUT', {
    status: 'Suspended'
  }, doctorToken);

  assert(
    suspendRes.status === 200 && suspendRes.data.passport?.status === 'Suspended',
    'Doctor successfully suspends passport (200 OK)',
    `Status: ${suspendRes.data?.passport?.status}`
  );

  // Public verifier rejects suspended passport
  const suspendedVerifyRes = await request(`/api/passport/verify/${rawToken2}`, 'GET');
  assert(
    suspendedVerifyRes.status === 403 && !suspendedVerifyRes.data.valid && suspendedVerifyRes.data.passport_status === 'Suspended',
    'Suspended token REJECTED by public verifier (403 Forbidden - Suspended)',
    `Status: ${suspendedVerifyRes.status}, Message: ${suspendedVerifyRes.data?.message}`
  );

  // Doctor reactivates passport
  const reactivateRes = await request('/api/passport/status/1', 'PUT', {
    status: 'Active',
    recovery_status: 'Fully Recovered'
  }, doctorToken);

  assert(
    reactivateRes.status === 200 && reactivateRes.data.passport?.status === 'Active',
    'Doctor reactivates passport & updates recovery status to Fully Recovered (200 OK)',
    `Status: ${reactivateRes.data?.passport?.status}`
  );

  // Public verifier now accepts reactivated token
  const reactivatedVerifyRes = await request(`/api/passport/verify/${rawToken2}`, 'GET');
  assert(
    reactivatedVerifyRes.status === 200 && reactivatedVerifyRes.data.valid && reactivatedVerifyRes.data.recovery_status === 'Fully Recovered',
    'Reactivated token verified successfully with updated recovery status (200 OK)',
    `Status: ${reactivatedVerifyRes.status}`
  );

  // -------------------------------------------------------------
  // SECTION 4: RATE LIMITING ON PUBLIC VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Public Verification Rate Limiter ---');

  let rateLimitHit = false;
  let remainingCalls = 0;

  // Send burst of 55 requests (configured limit is 50 requests / min)
  for (let i = 0; i < 55; i++) {
    const burstRes = await request(`/api/passport/verify/${rawToken2}`, 'GET');
    if (burstRes.status === 429) {
      rateLimitHit = true;
      break;
    }
    remainingCalls = burstRes.headers['x-ratelimit-remaining'];
  }

  assert(
    rateLimitHit,
    'Rate limiter active: Throttles high-frequency public verification bursts (429 Too Many Requests)',
    `Rate limit triggered successfully.`
  );

  // -------------------------------------------------------------
  // SECTION 5: AUTHENTICATED RETRIEVAL & CAREGIVER CONSENT
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Authenticated Passport Retrieval & Access Controls ---');

  // Patient John views their own passport
  const patientPassportRes = await request('/api/passport/patient/1', 'GET', null, patientToken);
  assert(
    patientPassportRes.status === 200 &&
    patientPassportRes.data.passport?.patient_id === 1 &&
    patientPassportRes.data.latest_discharge,
    'Patient views own recovery passport with authorized discharge instructions (200 OK)',
    `Patient Name: ${patientPassportRes.data?.passport?.patient_name}`
  );

  // Patient John BLOCKED from viewing Patient 2 passport
  const patientBlockedOther = await request('/api/passport/patient/2', 'GET', null, patientToken);
  assert(
    patientBlockedOther.status === 403,
    'Patient BLOCKED from viewing another patient recovery passport (403 Forbidden)',
    `Status: ${patientBlockedOther.status}`
  );

  // Caregiver Mary (with Acknowledged handover) views Patient 1 passport
  const caregiverPassportRes = await request('/api/passport/patient/1', 'GET', null, caregiverToken);
  assert(
    caregiverPassportRes.status === 200 && caregiverPassportRes.data.passport,
    'Caregiver with ACKNOWLEDGED handover views patient recovery passport (200 OK)',
    `Status: ${caregiverPassportRes.status}`
  );

  // Clinical Staff (Doctor) views Patient 1 passport
  const doctorViewPassport = await request('/api/passport/patient/1', 'GET', null, doctorToken);
  assert(
    doctorViewPassport.status === 200 && doctorViewPassport.data.passport,
    'Doctor authorized to view patient recovery passport (200 OK)',
    `Status: ${doctorViewPassport.status}`
  );

  // -------------------------------------------------------------
  // SECTION 6: REGRESSION VERIFICATION (PHASE 1, 2, & 3)
  // -------------------------------------------------------------
  console.log('\n--- 6. Regression Verification ---');

  // Phase 1 Health check
  const healthRes = await request('/api/health', 'GET');
  assert(healthRes.status === 200 && healthRes.data.database?.connected, 'Phase 1 Health check healthy (200 OK)');

  // Phase 2 Auth profile
  const meRes = await request('/api/auth/me', 'GET', null, doctorToken);
  assert(meRes.status === 200 && meRes.data.user.role === 'Doctor', 'Phase 2 Auth /me intact (200 OK)');

  // Phase 3 Discharge summary
  const dischargeRes = await request('/api/discharge/patient/1', 'GET', null, doctorToken);
  assert(dischargeRes.status === 200 && dischargeRes.data.discharges.length > 0, 'Phase 3 Discharge summaries intact (200 OK)');

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
