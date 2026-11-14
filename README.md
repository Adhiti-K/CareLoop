# CARELOOP: Smart Post-Discharge Patient Care and Recovery Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org)

CareLoop is a full-stack post-discharge healthcare coordination platform engineered to eliminate communication breakdowns between hospital care teams, discharged recovering patients, and family caregivers.

---

## 🌟 Key Features
1. **QR-Based Digital Recovery Passport**: Secure cryptographic token hashed in PostgreSQL with real-time verification URLs.
2. **Automated Follow-Up Reminders & Missed Appointment Alerts**: Node-Cron background jobs detecting upcoming visits and alerting patients and staff.
3. **Digital Discharge & Caregiver Handover**: Structured post-operative directives, medication regimens, and patient-controlled caregiver permissions.
4. **Patient Query Resolution**: Direct inquiries categorized by medication, wound care, and symptoms with doctor response logs.
5. **Medical Document Storage**: Signed URLs and metadata tracking in private Supabase buckets.
6. **Six Role Dashboards**: Separate, secure dashboards for Admin, Doctor, Nurse, Receptionist, Patient, and Caregiver.

---

## 🚀 Quick Setup & Startup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
# Backend starts on http://localhost:5000
# Health check available at http://localhost:5000/api/health
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

### 3. Database Migrations
Supabase PostgreSQL migrations are available in:
- `backend/database/migrations/001_initial_schema.sql` (Creates all 17 tables, indexes, constraints, and RLS policies)
- `backend/database/seed/002_seed_data.sql` (Initial clinical units and seed data)

---

## 👥 Demo Logins
All roles can be accessed directly from the **Quick Switch Role Login** on the login page:
- **Doctor**: `doctor@careloop.local`
- **Patient**: `patient@careloop.local`
- **Nurse**: `nurse@careloop.local`
- **Administrator**: `admin@careloop.local`
- **Receptionist**: `receptionist@careloop.local`
- **Caregiver**: `caregiver@careloop.local`
*(Password: `demoPass123`)*

Triage Passport Scanning test: `/verify-passport` with token `CL_TOKEN_PAT1_SECURE992837`.
