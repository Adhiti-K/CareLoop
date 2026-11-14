# CARELOOP API CONTRACT & ENDPOINT SPECIFICATION

## Base URL: `http://localhost:5000/api`

---

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (patient/caregiver) / Admin (staff) | Registers a user, provisions profile and role records. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns user metadata and token. |
| `POST` | `/api/auth/logout` | Public | Terminates active session. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current session profile & role details. |

---

### 2. User & Department Management (`/api/users`, `/api/departments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin, Doctor, Receptionist | Lists all system users with role filters. |
| `GET` | `/api/users/:id` | Authenticated | Fetches single user profile. |
| `POST` | `/api/users` | Admin | Provisions a staff/admin user. |
| `PUT` | `/api/users/:id` | Admin | Updates user status or profile details. |
| `DELETE` | `/api/users/:id` | Admin | Deletes user record. |
| `GET` | `/api/departments` | Authenticated | Lists clinical hospital departments. |
| `POST` | `/api/departments` | Admin | Creates a new hospital department. |

---

### 3. Patient Management (`/api/patients`, `/api/doctors`, `/api/nurses`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/patients` | Admin, Doctor, Nurse, Receptionist | Returns list of registered patients with discharge flags. |
| `GET` | `/api/patients/:id` | Staff, Patient Self, Authorized Caregiver | Full clinical profile, appointments, documents, passport. |
| `POST` | `/api/patients` | Admin, Receptionist, Doctor | Registers new patient with auto-generated Recovery ID (`CL-MYS-YYYY-XXXXX`). |
| `PUT` | `/api/patients/:id` | Admin, Receptionist, Doctor | Modifies patient contact, address or emergency details. |
| `GET` | `/api/doctors` | Authenticated | Returns clinical doctor list with specialties. |
| `GET` | `/api/nurses` | Authenticated | Returns nursing staff list. |

---

### 4. Follow-up Appointments (`/api/appointments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments` | Role-filtered (Self, Doctor, Admin, Caregiver) | Lists appointments. |
| `POST` | `/api/appointments` | Doctor, Receptionist, Admin | Schedules an appointment and creates automated 24hr reminder job. |
| `PUT` | `/api/appointments/:id` | Doctor, Receptionist, Admin | Reschedules or updates appointment. |
| `DELETE` | `/api/appointments/:id` | Doctor, Receptionist, Patient, Admin | Cancels appointment and updates status. |

---

### 5. Discharge Management (`/api/discharges`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/discharges/:patientId` | Staff, Patient Self, Authorized Caregiver | Returns post-discharge instructions, medications, follow-up advice. |
| `POST` | `/api/discharges` | Doctor, Admin | Finalizes digital discharge summary and emits in-app alert. |
| `PUT` | `/api/discharges/:id` | Doctor, Admin | Amends discharge instructions or medications. |

---

### 6. QR Digital Recovery Passport (`/api/qr`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/qr/generate/:patientId` | Authenticated | Generates/re-issues cryptographically hashed QR passport token. |
| `GET` | `/api/qr/passport/:patientId` | Authenticated | Fetches active QR data URL & verification link. |
| `GET` | `/api/qr/verify/:token` | Public / Authorized Scanner | Verifies token authenticity, returning non-confidential triage info. |
| `POST` | `/api/qr/revoke/:patientId` | Authenticated Staff / Patient | Revokes active QR passport code. |

---

### 7. Patient Queries & Notifications (`/api/queries`, `/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/queries` | Patient (Self), Staff (All) | Lists queries with status (Open / In Progress / Resolved). |
| `POST` | `/api/queries` | Patient, Caregiver | Submits recovery query with category and description. |
| `PUT` | `/api/queries/:id/resolve` | Doctor, Nurse, Admin | Responds to patient query and records query history. |
| `GET` | `/api/notifications` | Authenticated User | Lists in-app notifications. |
| `PUT` | `/api/notifications/:id/read` | Authenticated User | Marks notification as read. |

---

### 8. Medical Documents & Caregiver Access (`/api/documents`, `/api/caregiver`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents/:patientId` | Staff, Patient Self, Authorized Caregiver | Lists clinical documents and lab reports. |
| `POST` | `/api/documents/upload` | Staff, Patient | Uploads document metadata & files to private storage. |
| `GET` | `/api/documents/:id/download` | Authorized Users | Generates short-lived signed download URL. |
| `POST` | `/api/caregiver/grant-access` | Patient, Admin | Authorizes caregiver email with granular permission flags. |
| `GET` | `/api/caregiver/authorized-patients` | Caregiver | Lists patients this caregiver has valid access to. |
| `DELETE` | `/api/caregiver/revoke-access/:id` | Patient, Admin | Revokes caregiver authorization immediately. |
