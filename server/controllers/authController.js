const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const ALLOWED_ROLES = [
  'Admin',
  'Doctor',
  'Nurse',
  'Patient',
  'Caregiver',
  'Care Coordinator'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generate a signed JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'careloop_dev_secret_fallback';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * User Registration Controller
 * POST /api/auth/register
 */
const register = async (req, res) => {
  let connection;
  try {
    const {
      full_name,
      email,
      password,
      role = 'Patient',
      phone,
      // Optional patient profile fields
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      // Optional caregiver fields
      relationship_to_patient,
      emergency_phone
    } = req.body;

    // 1. Input Validation
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters.'
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Require at least one letter and one number for password complexity
    const passwordHasLetter = /[a-zA-Z]/.test(password);
    const passwordHasNumber = /[0-9]/.test(password);
    if (!passwordHasLetter || !passwordHasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one letter and one number.'
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Allowed roles: ${ALLOWED_ROLES.join(', ')}`
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = full_name.trim();

    // 2. Obtain connection for transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if email already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [sanitizedEmail]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user into users table
    const [userResult] = await connection.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [sanitizedName, sanitizedEmail, password_hash, role, phone || null]
    );

    const userId = userResult.insertId;
    let patientId = null;
    let caregiverId = null;

    // Automatically create profile record based on role
    if (role === 'Patient') {
      const [patientResult] = await connection.query(
        `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          date_of_birth || null,
          gender || null,
          blood_group || null,
          address || null,
          emergency_contact_name || null,
          emergency_contact_phone || null
        ]
      );
      patientId = patientResult.insertId;
    } else if (role === 'Caregiver') {
      const [caregiverResult] = await connection.query(
        `INSERT INTO caregivers (user_id, relationship_to_patient, emergency_phone)
         VALUES (?, ?, ?)`,
        [userId, relationship_to_patient || null, emergency_phone || phone || null]
      );
      caregiverId = caregiverResult.insertId;
    }

    await connection.commit();
    connection.release();

    // Generate JWT token
    const token = generateToken({
      id: userId,
      email: sanitizedEmail,
      role,
      full_name: sanitizedName,
      patient_id: patientId,
      caregiver_id: caregiverId
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: userId,
        full_name: sanitizedName,
        email: sanitizedEmail,
        role,
        phone: phone || null,
        patient_id: patientId,
        caregiver_id: caregiverId
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.'
    });
  }
};

/**
 * User Login Controller
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const sanitizedEmail = String(email).trim().toLowerCase();

    // 2. Parameterized lookup of user
    const [users] = await pool.query(
      `SELECT id, full_name, email, password_hash, role, phone, is_active
       FROM users WHERE email = ?`,
      [sanitizedEmail]
    );

    if (users.length === 0) {
      // Secure generic response to prevent user enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Check account status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    // 3. Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 4. Retrieve linked patient_id or caregiver_id
    let patientId = null;
    let caregiverId = null;

    if (user.role === 'Patient') {
      const [patients] = await pool.query(
        'SELECT id FROM patients WHERE user_id = ?',
        [user.id]
      );
      if (patients.length > 0) {
        patientId = patients[0].id;
      }
    } else if (user.role === 'Caregiver') {
      const [caregivers] = await pool.query(
        'SELECT id FROM caregivers WHERE user_id = ?',
        [user.id]
      );
      if (caregivers.length > 0) {
        caregiverId = caregivers[0].id;
      }
    }

    // 5. Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      patient_id: patientId,
      caregiver_id: caregiverId
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        patient_id: patientId,
        caregiver_id: caregiverId
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
};

/**
 * Get Authenticated User Profile Controller
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch fresh user data from database
    const [users] = await pool.query(
      `SELECT id, full_name, email, role, phone, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const userProfile = { ...users[0] };

    // If role is Patient, attach full patient profile
    if (userProfile.role === 'Patient') {
      const [patients] = await pool.query(
        `SELECT id as patient_id, date_of_birth, gender, blood_group, address,
                emergency_contact_name, emergency_contact_phone
         FROM patients WHERE user_id = ?`,
        [userId]
      );
      if (patients.length > 0) {
        userProfile.patient_profile = patients[0];
      }
    }

    // If role is Caregiver, attach caregiver profile and linked patients
    if (userProfile.role === 'Caregiver') {
      const [caregivers] = await pool.query(
        `SELECT id as caregiver_id, relationship_to_patient, emergency_phone
         FROM caregivers WHERE user_id = ?`,
        [userId]
      );
      if (caregivers.length > 0) {
        userProfile.caregiver_profile = caregivers[0];

        // Fetch linked patients for this caregiver
        const [linkedPatients] = await pool.query(
          `SELECT p.id as patient_id, u.full_name as patient_name, u.email as patient_email,
                  m.is_primary, m.created_at as linked_since
           FROM patient_caregiver_mappings m
           JOIN patients p ON m.patient_id = p.id
           JOIN users u ON p.user_id = u.id
           WHERE m.caregiver_id = ?`,
          [caregivers[0].caregiver_id]
        );
        userProfile.caregiver_profile.linked_patients = linkedPatients;
      }
    }

    return res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
