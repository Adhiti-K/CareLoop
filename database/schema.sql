-- =====================================================================
-- CARELOOP DATABASE SCHEMA
-- Project: CARELOOP - Digital Patient Recovery and Continuity of Care Platform
-- Database Name: careloop_db
-- Developer: Inchara - Backend Developer
-- Technology: MySQL 8.0+ / utf8mb4
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `careloop_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `careloop_db`;

-- ---------------------------------------------------------------------
-- Disable foreign key checks for clean teardown/rebuild if needed
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `medical_documents`;
DROP TABLE IF EXISTS `query_responses`;
DROP TABLE IF EXISTS `patient_queries`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `recovery_passports`;
DROP TABLE IF EXISTS `caregiver_handovers`;
DROP TABLE IF EXISTS `discharge_summaries`;
DROP TABLE IF EXISTS `patient_caregiver_mappings`;
DROP TABLE IF EXISTS `caregivers`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. USERS & ROLES TABLE
-- Roles: Admin, Doctor, Nurse, Patient, Caregiver, Care Coordinator
-- =====================================================================
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin', 'Doctor', 'Nurse', 'Patient', 'Caregiver', 'Care Coordinator') NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. PATIENTS PROFILE TABLE
-- =====================================================================
CREATE TABLE `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `date_of_birth` DATE DEFAULT NULL,
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `emergency_contact_name` VARCHAR(150) DEFAULT NULL,
  `emergency_contact_phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_patients_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. CAREGIVERS PROFILE TABLE
-- =====================================================================
CREATE TABLE `caregivers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `relationship_to_patient` VARCHAR(100) DEFAULT NULL,
  `emergency_phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_caregivers_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. PATIENT-CAREGIVER MAPPINGS
-- =====================================================================
CREATE TABLE `patient_caregiver_mappings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `caregiver_id` INT NOT NULL,
  `is_primary` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_patient_caregiver` (`patient_id`, `caregiver_id`),
  CONSTRAINT `fk_mapping_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mapping_caregiver` FOREIGN KEY (`caregiver_id`)
    REFERENCES `caregivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. DIGITAL DISCHARGE SUMMARIES (Feature 3)
-- Created by Doctor/Nurse upon patient discharge
-- =====================================================================
CREATE TABLE `discharge_summaries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `nurse_id` INT DEFAULT NULL,
  `admission_date` DATE NOT NULL,
  `discharge_date` DATE NOT NULL,
  `diagnosis` TEXT NOT NULL,
  `discharge_condition` ENUM('Stable', 'Requires Assistance', 'Critical Observation', 'Recovered') DEFAULT 'Stable',
  `medications_summary` TEXT DEFAULT NULL,
  `care_instructions` TEXT NOT NULL,
  `emergency_contact_name` VARCHAR(150) DEFAULT NULL,
  `emergency_contact_phone` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Draft', 'Approved', 'Finalized') DEFAULT 'Draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_discharge_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_discharge_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_discharge_nurse` FOREIGN KEY (`nurse_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_discharge_patient` (`patient_id`),
  INDEX `idx_discharge_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. CAREGIVER HANDOVERS (Feature 3)
-- Caregiver handover workflow & digital sign-off
-- =====================================================================
CREATE TABLE `caregiver_handovers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `discharge_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `caregiver_id` INT NOT NULL,
  `assigned_by_id` INT NOT NULL,
  `handover_notes` TEXT NOT NULL,
  `care_responsibilities` TEXT NOT NULL,
  `status` ENUM('Pending Acknowledgment', 'Acknowledged', 'Declined') DEFAULT 'Pending Acknowledgment',
  `acknowledged_at` TIMESTAMP NULL DEFAULT NULL,
  `caregiver_signature_name` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_handover_discharge` FOREIGN KEY (`discharge_id`)
    REFERENCES `discharge_summaries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_handover_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_handover_caregiver` FOREIGN KEY (`caregiver_id`)
    REFERENCES `caregivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_handover_assigned_by` FOREIGN KEY (`assigned_by_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_handover_caregiver` (`caregiver_id`),
  INDEX `idx_handover_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. QR-BASED DIGITAL RECOVERY PASSPORT (Feature 1)
-- Stores token & recovery state (No medical info stored in QR itself)
-- =====================================================================
CREATE TABLE `recovery_passports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL UNIQUE,
  `passport_token` VARCHAR(64) NOT NULL UNIQUE,
  `recovery_status` ENUM('In Recovery', 'Fully Recovered', 'Under Observation', 'Requires Follow-up') DEFAULT 'In Recovery',
  `qr_code_data_url` MEDIUMTEXT DEFAULT NULL,
  `status` ENUM('Active', 'Suspended', 'Expired') DEFAULT 'Active',
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_passport_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  INDEX `idx_passport_token` (`passport_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 8. FOLLOW-UP APPOINTMENTS (Feature 2)
-- Automatic follow-up reminders & missed appointment tracking
-- =====================================================================
CREATE TABLE `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `care_coordinator_id` INT DEFAULT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('Scheduled', 'Completed', 'Missed', 'Cancelled') DEFAULT 'Scheduled',
  `reminder_sent` BOOLEAN DEFAULT FALSE,
  `missed_alert_sent` BOOLEAN DEFAULT FALSE,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointment_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_appointment_coordinator` FOREIGN KEY (`care_coordinator_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_appt_date_status` (`appointment_date`, `status`),
  INDEX `idx_appt_patient` (`patient_id`),
  INDEX `idx_appt_doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 9. NOTIFICATIONS & REMINDERS (Feature 2)
-- =====================================================================
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `appointment_id` INT DEFAULT NULL,
  `type` ENUM('Follow-up Reminder', 'Missed Appointment', 'Discharge Update', 'Handover Request', 'Query Response', 'General Alert') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `scheduled_for` TIMESTAMP NULL DEFAULT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_appointment` FOREIGN KEY (`appointment_id`)
    REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 10. PATIENT QUERIES & RESOLUTION MANAGEMENT (Feature 4)
-- =====================================================================
CREATE TABLE `patient_queries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `caregiver_id` INT DEFAULT NULL,
  `assigned_to_id` INT DEFAULT NULL,
  `category` ENUM('Medication', 'Symptom Concern', 'Wound Care', 'Follow-up Inquiry', 'Diet & Nutrition', 'General Care', 'Emergency Assistance') NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `status` ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
  `resolution_notes` TEXT DEFAULT NULL,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_query_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_query_caregiver` FOREIGN KEY (`caregiver_id`)
    REFERENCES `caregivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_query_assigned_to` FOREIGN KEY (`assigned_to_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_query_patient` (`patient_id`),
  INDEX `idx_query_status` (`status`),
  INDEX `idx_query_assigned` (`assigned_to_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 11. QUERY RESPONSES (Feature 4)
-- =====================================================================
CREATE TABLE `query_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `query_id` INT NOT NULL,
  `responder_id` INT NOT NULL,
  `response_text` TEXT NOT NULL,
  `is_internal_note` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_response_query` FOREIGN KEY (`query_id`)
    REFERENCES `patient_queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_response_responder` FOREIGN KEY (`responder_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_response_query` (`query_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 12. MEDICAL DOCUMENT MANAGEMENT (Feature 5)
-- =====================================================================
CREATE TABLE `medical_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `uploaded_by_id` INT NOT NULL,
  `document_type` ENUM('Discharge Summary', 'Prescription', 'Lab Report', 'Imaging', 'Care Plan', 'Other') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_document_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_uploader` FOREIGN KEY (`uploaded_by_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_doc_patient` (`patient_id`),
  INDEX `idx_doc_type` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- FICTIONAL DEMO SEED DATA
-- Default password for all demo accounts: Demo@1234
-- Bcrypt Hash: $2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge
-- =====================================================================

-- 1. Insert Demo Users across all 6 roles
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `phone`) VALUES
(1, 'System Administrator', 'admin@careloop.demo', '$2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge', 'Admin', '+91 9876543210'),
(2, 'Dr. Sarah Sharma', 'doctor.sarah@careloop.demo', '$2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge', 'Doctor', '+91 9876543211'),
(3, 'Nurse Priya Rao', 'nurse.priya@careloop.demo', '$2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge', 'Nurse', '+91 9876543212'),
(4, 'Anita Desai', 'coordinator.anita@careloop.demo', '$2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge', 'Care Coordinator', '+91 9876543213'),
(5, 'John Doe', 'patient.john@careloop.demo', '$2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge', 'Patient', '+91 9876543214'),
(6, 'Mary Doe', 'caregiver.mary@careloop.demo', '$2a$10$m9zGeu5qCfLu0xVSCM.ex.gSrzRHJ50TJ14H08mx4VFR4lKnJ35ge', 'Caregiver', '+91 9876543215');

-- 2. Insert Patient Profile for John Doe
INSERT INTO `patients` (`id`, `user_id`, `date_of_birth`, `gender`, `blood_group`, `address`, `emergency_contact_name`, `emergency_contact_phone`) VALUES
(1, 5, '1985-06-15', 'Male', 'O+', '42 Rosewood Lane, Bengaluru, Karnataka', 'Mary Doe', '+91 9876543215');

-- 3. Insert Caregiver Profile for Mary Doe
INSERT INTO `caregivers` (`id`, `user_id`, `relationship_to_patient`, `emergency_phone`) VALUES
(1, 6, 'Spouse', '+91 9876543215');

-- 4. Map Caregiver to Patient
INSERT INTO `patient_caregiver_mappings` (`id`, `patient_id`, `caregiver_id`, `is_primary`) VALUES
(1, 1, 1, TRUE);

-- 5. Insert Sample Discharge Summary (Feature 3)
INSERT INTO `discharge_summaries` (`id`, `patient_id`, `doctor_id`, `nurse_id`, `admission_date`, `discharge_date`, `diagnosis`, `discharge_condition`, `medications_summary`, `care_instructions`, `emergency_contact_name`, `emergency_contact_phone`, `status`) VALUES
(1, 1, 2, 3, '2026-11-01', '2026-11-10', 'Post-Laparoscopic Cholecystectomy', 'Stable', 'Paracetamol 650mg PO TID PRN pain; Amoxicillin-Clavulanate 625mg PO BID x 5 days; Pantoprazole 40mg PO OD before breakfast x 7 days.', 'Keep surgical wound dry for 48 hours. Light walking encouraged. Avoid lifting weights > 5kg for 4 weeks. Call hospital if temperature > 100.4 F or severe abdominal pain occurs.', 'Mary Doe', '+91 9876543215', 'Finalized');

-- 6. Insert Sample Caregiver Handover (Feature 3)
INSERT INTO `caregiver_handovers` (`id`, `discharge_id`, `patient_id`, `caregiver_id`, `assigned_by_id`, `handover_notes`, `care_responsibilities`, `status`, `acknowledged_at`, `caregiver_signature_name`) VALUES
(1, 1, 1, 1, 2, 'Patient discharged in stable condition. Caregiver oriented on wound dressing check, medication schedule, and emergency alert symptoms.', 'Ensure timely administration of oral antibiotics. Monitor temperature daily. Maintain surgical site hygiene. Accompany patient to follow-up on 2026-11-20.', 'Acknowledged', '2026-11-10 14:30:00', 'Mary Doe');

-- 7. Insert Sample Recovery Passport (Feature 1)
-- Note: Passport token is a secure random string. Never store medical info in QR code!
INSERT INTO `recovery_passports` (`id`, `patient_id`, `passport_token`, `recovery_status`, `qr_code_data_url`, `status`, `issued_at`, `expires_at`) VALUES
(1, 1, 'pass_token_9f8e7d6c5b4a3210e4d3c2b1a0f9e8d7', 'In Recovery', NULL, 'Active', '2026-11-10 12:00:00', '2027-11-10 12:00:00');

-- 8. Insert Sample Appointments (Feature 2)
INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `care_coordinator_id`, `appointment_date`, `appointment_time`, `reason`, `status`, `reminder_sent`, `missed_alert_sent`, `notes`) VALUES
(1, 1, 2, 4, '2026-11-20', '10:30:00', 'Post-Operative 10-Day Wound Inspection & Recovery Review', 'Scheduled', FALSE, FALSE, 'Bring discharge folder and medication log.'),
(2, 1, 2, 4, '2026-11-05', '14:00:00', 'Initial Pre-Discharge Assessment', 'Completed', TRUE, FALSE, 'Patient cleared for scheduled discharge.');

-- 9. Insert Sample Notifications (Feature 2)
INSERT INTO `notifications` (`id`, `user_id`, `appointment_id`, `type`, `title`, `message`, `is_read`, `scheduled_for`, `sent_at`) VALUES
(1, 5, 1, 'Follow-up Reminder', 'Upcoming Follow-up Appointment', 'You have a scheduled post-op checkup with Dr. Sarah Sharma on Nov 20, 2026 at 10:30 AM.', FALSE, '2026-11-19 10:30:00', '2026-11-14 09:00:00'),
(2, 6, 1, 'Follow-up Reminder', 'Caregiver Reminder: Follow-up Appointment', 'John Doe has a recovery follow-up scheduled with Dr. Sarah Sharma on Nov 20, 2026 at 10:30 AM.', FALSE, '2026-11-19 10:30:00', '2026-11-14 09:00:00');

-- 10. Insert Sample Patient Query & Response (Feature 4)
INSERT INTO `patient_queries` (`id`, `patient_id`, `caregiver_id`, `assigned_to_id`, `category`, `subject`, `description`, `priority`, `status`, `resolution_notes`, `resolved_at`) VALUES
(1, 1, 1, 3, 'Wound Care', 'Mild redness around lower incision site', 'We noticed slight redness near the lower dressing today. There is no active discharge, but the area feels warm to touch. Is this normal?', 'Medium', 'Resolved', 'Assessed via telehealth query: Normal post-op inflammatory response. Advised clean dressing change and cold compress.', '2026-11-12 11:15:00');

INSERT INTO `query_responses` (`id`, `query_id`, `responder_id`, `response_text`, `is_internal_note`) VALUES
(1, 1, 3, 'Hello Mary and John. Mild redness without foul odor or purulent discharge is common during normal wound granulation. Please monitor for any temperature spike above 100.4 F. Continue keeping the area dry and clean.', FALSE);

-- 11. Insert Sample Medical Document Record (Feature 5)
INSERT INTO `medical_documents` (`id`, `patient_id`, `uploaded_by_id`, `document_type`, `title`, `description`, `file_name`, `original_name`, `file_path`, `file_size`, `mime_type`) VALUES
(1, 1, 2, 'Discharge Summary', 'Official Discharge Summary - Lap Cholecystectomy', 'Finalized discharge summary signed by Dr. Sarah Sharma', 'doc_demo_discharge_summary.pdf', 'Discharge_Summary_JohnDoe.pdf', 'uploads/documents/doc_demo_discharge_summary.pdf', 245760, 'application/pdf');
