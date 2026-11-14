# CareLoop System Architecture & Blueprint

```mermaid
graph TD
    User([End Users: Admin, Doctor, Nurse, Receptionist, Patient, Caregiver]) --> ReactApp[CareLoop React Frontend - Vite + Tailwind]
    ReactApp --> Axios[Centralized Axios Client with JWT Interceptors]
    Axios --> ExpressAPI[Node.js Express REST Backend - Port 5000]

    subgraph Backend Core
        ExpressAPI --> AuthMW[Auth & RBAC Middleware]
        AuthMW --> Endpoints[Controllers & Business Services]
        Endpoints --> QRServ[QR Recovery Passport Generator]
        Endpoints --> CronServ[Node-Cron: 24h Reminders & Missed Appointment Detection]
    end

    subgraph Supabase PostgreSQL Cloud
        Endpoints --> SupaDB[(Supabase PostgreSQL Database)]
        SupaDB --> RLS[Row Level Security Engine]
        RLS --> Tables[(17 Relational Tables)]
    end

    subgraph Storage
        Endpoints --> SupaStorage[Supabase Private Medical Documents Bucket]
    end
```

## Security & Verification Layers
1. **Cryptographic Tokens**: Patient Recovery Passports store SHA-256 hashes in PostgreSQL; triage scans query sanitized records without exposing internal database identifiers.
2. **Role-Based Access Control**: Express route-level enforcement backed by Supabase session tokens prevents unauthorized privilege escalation.
3. **Automated Reminders & Missed Appointment Tracking**: Node-Cron jobs periodically detect appointments needing alerts, preventing duplicate notifications.
