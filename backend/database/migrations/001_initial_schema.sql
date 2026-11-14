-- CareLoop Complete PostgreSQL Schema Migration
-- Migration 001_initial_schema.sql
-- Supports: 6 Roles (admin, doctor, nurse, receptionist, patient, caregiver)
-- Features: QR Recovery Passport, Automatic Reminders, Discharges, Queries, Documents, Audit Logs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES TABLE (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'patient', 'caregiver')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recovery_id VARCHAR(50) NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    address TEXT,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    specialization VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NURSES TABLE
CREATE TABLE IF NOT EXISTS nurses (
    nurse_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PATIENT ASSIGNMENTS (Doctors / Nurses assigned to patients)
CREATE TABLE IF NOT EXISTS patient_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_role VARCHAR(50) NOT NULL CHECK (assigned_role IN ('doctor', 'nurse')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_active_staff_assignment UNIQUE (patient_id, staff_user_id, assigned_role)
);

-- 7. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'Missed')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. APPOINTMENT REMINDERS TABLE
CREATE TABLE IF NOT EXISTS appointment_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) DEFAULT '24hr_prior' CHECK (reminder_type IN ('24hr_prior', '2hr_prior', 'same_day', 'custom')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_appointment_reminder UNIQUE (appointment_id, reminder_type)
);

-- 9. DISCHARGES TABLE
CREATE TABLE IF NOT EXISTS discharges (
    discharge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    discharge_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    medication_details TEXT NOT NULL,
    instructions TEXT NOT NULL,
    follow_up_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RECOVERY PASSPORTS TABLE (QR & Verification)
CREATE TABLE IF NOT EXISTS recovery_passports (
    passport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    recovery_id VARCHAR(50) NOT NULL REFERENCES patients(recovery_id) ON DELETE CASCADE,
    qr_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PATIENT QUERIES TABLE
CREATE TABLE IF NOT EXISTS patient_queries (
    query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    response TEXT,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. QUERY HISTORY TABLE
CREATE TABLE IF NOT EXISTS query_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES patient_queries(query_id) ON DELETE CASCADE,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MEDICAL DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS medical_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CAREGIVER ACCESS TABLE
CREATE TABLE IF NOT EXISTS caregiver_access (
    access_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    caregiver_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permission_status VARCHAR(50) DEFAULT 'Active' CHECK (permission_status IN ('Active', 'Revoked', 'Pending')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT unique_caregiver_patient UNIQUE (patient_id, caregiver_user_id)
);

-- 16. CAREGIVER PERMISSIONS TABLE (Granular Access Controls)
CREATE TABLE IF NOT EXISTS caregiver_permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_id UUID NOT NULL REFERENCES caregiver_access(access_id) ON DELETE CASCADE,
    can_view_discharge BOOLEAN DEFAULT TRUE,
    can_view_appointments BOOLEAN DEFAULT TRUE,
    can_view_documents BOOLEAN DEFAULT FALSE,
    can_view_recovery_information BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_recovery_id ON patients(recovery_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_nurses_user_id ON nurses(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_discharges_patient_id ON discharges(patient_id);
CREATE INDEX IF NOT EXISTS idx_recovery_passports_token ON recovery_passports(qr_token_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_queries_patient_id ON patient_queries(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_access_user ON caregiver_access(caregiver_user_id, permission_status);

-- ROW LEVEL SECURITY (RLS) POLICIES CONFIGURATION
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role from auth.uid()
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Profiles Policies
CREATE POLICY "Public profiles viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Departments Policies (Read by all authenticated, modified by admin)
CREATE POLICY "Departments viewable by authenticated users" 
ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Departments managed by admin" 
ON departments FOR ALL TO authenticated USING (get_current_user_role() = 'admin');

-- Patients Policies
CREATE POLICY "Patients viewable by staff or self or authorized caregiver" 
ON patients FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('admin', 'doctor', 'nurse', 'receptionist')
    OR user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM caregiver_access ca 
        WHERE ca.patient_id = patients.patient_id 
        AND ca.caregiver_user_id = auth.uid() 
        AND ca.permission_status = 'Active'
    )
);

-- Appointments Policies
CREATE POLICY "Appointments access policy" 
ON appointments FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('admin', 'receptionist')
    OR (get_current_user_role() = 'doctor' AND doctor_id IN (SELECT doctor_id FROM doctors WHERE user_id = auth.uid()))
    OR (get_current_user_role() = 'nurse' AND EXISTS (SELECT 1 FROM patient_assignments pa WHERE pa.patient_id = appointments.patient_id AND pa.staff_user_id = auth.uid() AND pa.is_active = true))
    OR (patient_id IN (SELECT patient_id FROM patients WHERE user_id = auth.uid()))
    OR EXISTS (
        SELECT 1 FROM caregiver_access ca 
        JOIN caregiver_permissions cp ON ca.access_id = cp.access_id 
        WHERE ca.patient_id = appointments.patient_id 
        AND ca.caregiver_user_id = auth.uid() 
        AND ca.permission_status = 'Active' 
        AND cp.can_view_appointments = true
    )
);

-- Notifications Policies
CREATE POLICY "Users see only their notifications" 
ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" 
ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
