import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { VerifyPassportPage } from './pages/public/VerifyPassportPage';

// Dashboards
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { NurseDashboard } from './pages/nurse/NurseDashboard';
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { CaregiverDashboard } from './pages/caregiver/CaregiverDashboard';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-passport" element={<VerifyPassportPage />} />
      <Route path="/verify-passport/:token" element={<VerifyPassportPage />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminDashboard />} />
          <Route path="patients" element={<AdminDashboard />} />
          <Route path="departments" element={<AdminDashboard />} />
          <Route path="discharges" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Doctor Routes */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/doctor" element={<DashboardLayout role="doctor" />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="patients" element={<DoctorDashboard />} />
          <Route path="discharge" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorDashboard />} />
          <Route path="queries" element={<DoctorDashboard />} />
        </Route>
      </Route>

      {/* Nurse Routes */}
      <Route element={<ProtectedRoute allowedRoles={['nurse']} />}>
        <Route path="/nurse" element={<DashboardLayout role="nurse" />}>
          <Route path="dashboard" element={<NurseDashboard />} />
          <Route path="patients" element={<NurseDashboard />} />
          <Route path="discharge" element={<NurseDashboard />} />
          <Route path="schedule" element={<NurseDashboard />} />
        </Route>
      </Route>

      {/* Receptionist Routes */}
      <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
        <Route path="/receptionist" element={<DashboardLayout role="receptionist" />}>
          <Route path="dashboard" element={<ReceptionistDashboard />} />
          <Route path="register-patient" element={<ReceptionistDashboard />} />
          <Route path="appointments" element={<ReceptionistDashboard />} />
          <Route path="patients" element={<ReceptionistDashboard />} />
        </Route>
      </Route>

      {/* Patient Routes */}
      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route path="/patient" element={<DashboardLayout role="patient" />}>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="passport" element={<PatientDashboard />} />
          <Route path="discharge" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientDashboard />} />
          <Route path="caregivers" element={<PatientDashboard />} />
          <Route path="queries" element={<PatientDashboard />} />
        </Route>
      </Route>

      {/* Caregiver Routes */}
      <Route element={<ProtectedRoute allowedRoles={['caregiver']} />}>
        <Route path="/caregiver" element={<DashboardLayout role="caregiver" />}>
          <Route path="dashboard" element={<CaregiverDashboard />} />
          <Route path="patients" element={<CaregiverDashboard />} />
          <Route path="discharge" element={<CaregiverDashboard />} />
          <Route path="appointments" element={<CaregiverDashboard />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
