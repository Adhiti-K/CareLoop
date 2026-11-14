import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiMessageSquare,
  FiAward, FiBell, FiLogOut, FiActivity, FiShield, FiHeart
} from 'react-icons/fi';

export const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await api.get('/notifications');
        if (res.success) {
          setNotifications(res.data);
        }
      } catch (e) {
        // silent fail
      }
    }
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setShowNotifDropdown(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const roleNavItems = {
    admin: [
      { name: 'Admin Dashboard', path: '/admin/dashboard', icon: FiHome },
      { name: 'User Management', path: '/admin/users', icon: FiUsers },
      { name: 'Patients Directory', path: '/admin/patients', icon: FiActivity },
      { name: 'Departments', path: '/admin/departments', icon: FiShield },
      { name: 'Discharge Records', path: '/admin/discharges', icon: FiFileText },
    ],
    doctor: [
      { name: 'Doctor Dashboard', path: '/doctor/dashboard', icon: FiHome },
      { name: 'Assigned Patients', path: '/doctor/patients', icon: FiUsers },
      { name: 'Discharge Management', path: '/doctor/discharge', icon: FiFileText },
      { name: 'Appointments', path: '/doctor/appointments', icon: FiCalendar },
      { name: 'Patient Queries', path: '/doctor/queries', icon: FiMessageSquare },
    ],
    nurse: [
      { name: 'Nurse Dashboard', path: '/nurse/dashboard', icon: FiHome },
      { name: 'Assigned Patients', path: '/nurse/patients', icon: FiUsers },
      { name: 'Discharge Assistance', path: '/nurse/discharge', icon: FiFileText },
      { name: 'Follow-Up Schedule', path: '/nurse/schedule', icon: FiCalendar },
    ],
    receptionist: [
      { name: 'Reception Dashboard', path: '/receptionist/dashboard', icon: FiHome },
      { name: 'Register Patient', path: '/receptionist/register-patient', icon: FiUsers },
      { name: 'Schedule Appointment', path: '/receptionist/appointments', icon: FiCalendar },
      { name: 'Patient Search', path: '/receptionist/patients', icon: FiActivity },
    ],
    patient: [
      { name: 'My Recovery Dashboard', path: '/patient/dashboard', icon: FiHome },
      { name: 'Recovery Passport (QR)', path: '/patient/passport', icon: FiAward },
      { name: 'Discharge Summary', path: '/patient/discharge', icon: FiFileText },
      { name: 'Appointments', path: '/patient/appointments', icon: FiCalendar },
      { name: 'Caregiver Permissions', path: '/patient/caregivers', icon: FiHeart },
      { name: 'Ask a Doctor (Queries)', path: '/patient/queries', icon: FiMessageSquare },
    ],
    caregiver: [
      { name: 'Caregiver Dashboard', path: '/caregiver/dashboard', icon: FiHome },
      { name: 'Authorized Patients', path: '/caregiver/patients', icon: FiUsers },
      { name: 'Recovery Instructions', path: '/caregiver/discharge', icon: FiFileText },
      { name: 'Patient Appointments', path: '/caregiver/appointments', icon: FiCalendar },
    ]
  };

  const navLinks = roleNavItems[role] || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <FiActivity className="text-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">CARELOOP</h1>
              <p className="text-xs text-teal-400 uppercase tracking-wider font-semibold">{role} Portal</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="text-lg" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <p className="text-sm font-semibold text-white leading-none">{user?.full_name || 'CareLoop User'}</p>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-[140px]">{user?.email}</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded uppercase bg-teal-900/60 text-teal-300 border border-teal-700/50">
              {role}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 rounded-lg transition"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital System</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-800 capitalize">{location.pathname.split('/').pop().replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
              >
                <FiBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-teal-600 hover:underline font-medium">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">No notifications right now</p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div key={n.notification_id} className={`p-3 text-xs ${n.is_read ? 'bg-white' : 'bg-teal-50/40'}`}>
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick QR Passport Action */}
            <Link
              to="/verify-passport"
              className="text-xs font-semibold px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <FiShield className="text-teal-600" /> Triage Scan QR
            </Link>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
