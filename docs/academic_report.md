# CareLoop Comprehensive VTU Mini-Project Documentation

## Abstract
CareLoop is a smart web-based healthcare management platform designed to address post-discharge communication and follow-up gaps between hospitals, recovering patients, and family caregivers. By coupling digital discharge instructions with cryptographically hashed QR-based Recovery Passports, CareLoop ensures continuous patient safety, transparent clinical handovers, and reliable follow-up adherence.

## 6 User Roles Supported
1. **Administrator**: Oversees hospital operations, accounts, clinical units, and volume analytics.
2. **Doctor**: Reviews assigned inpatients/outpatients, issues digital discharge directives, formulates medication regimens, and answers patient queries.
3. **Nurse**: Manages discharge procedures, checks vital care instructions, and supports caregiver handovers.
4. **Receptionist**: Handles digital patient registration, generates Recovery IDs, and books follow-up consultations.
5. **Patient**: Accesses personal QR Recovery Passport, reviews discharge medication schedules, schedules appointments, and asks clinical questions.
6. **Caregiver**: Granted granular access by patients to view medications, emergency instructions, and follow-up dates.

## 5 Main Implemented Features
1. **QR-Based Digital Recovery Passport**: Generates unique recovery IDs (e.g. `CL-MYS-2026-00556`) and cryptographically hashed verification URLs for rapid triage.
2. **Automatic Follow-Up and Missed-Appointment Notifications**: Scheduled background jobs with duplicate prevention send reminders and flag missed appointments.
3. **Digital Discharge and Caregiver Handover**: Formalized post-operative instructions with doctor signatures and caregiver permission grants.
4. **Patient Query and Resolution Management**: Patients submit inquiries across categories (medications, wound care), and doctors resolve queries with audit history.
5. **Medical Document Management**: Secure upload, metadata tracking, and short-lived signed URLs for lab reports and discharge cards.
