import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiCalendar, FiActivity, FiFileText, FiClock, FiPlus } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    nurses: 0,
    receptionists: 0,
    appointments: 0,
    discharged: 0,
    queries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [usersRes, patientsRes, aptsRes, queriesRes] = await Promise.all([
          api.get('/users'),
          api.get('/patients'),
          api.get('/appointments'),
          api.get('/queries')
        ]);

        const users = usersRes.data || [];
        const patients = patientsRes.data || [];
        const apts = aptsRes.data || [];
        const queries = queriesRes.data || [];

        setStats({
          patients: patients.length,
          doctors: users.filter(u => u.role === 'doctor').length,
          nurses: users.filter(u => u.role === 'nurse').length,
          receptionists: users.filter(u => u.role === 'receptionist').length,
          appointments: apts.length,
          discharged: patients.filter(p => p.is_discharged).length,
          queries: queries.length
        });
      } catch (err) {
        console.error('Failed loading admin statistics', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const chartData = [
    { name: 'Patients', count: stats.patients },
    { name: 'Discharged', count: stats.discharged },
    { name: 'Appointments', count: stats.appointments },
    { name: 'Queries', count: stats.queries },
    { name: 'Doctors', count: stats.doctors },
    { name: 'Nurses', count: stats.nurses }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hospital Administration Overview</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time status of discharged patients, clinical staff, and follow-up adherence</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Supabase Sync
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-teal-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Patients</span>
            <FiUsers className="text-xl" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.patients}</div>
          <p className="text-[11px] text-teal-600 font-semibold mt-1">{stats.discharged} actively discharged</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Doctors & Nurses</span>
            <FiActivity className="text-xl" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.doctors + stats.nurses}</div>
          <p className="text-[11px] text-slate-500 mt-1">{stats.doctors} Doctors | {stats.nurses} Nurses</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Appointments</span>
            <FiCalendar className="text-xl" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.appointments}</div>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">Automated 24h cron alerts active</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Patient Queries</span>
            <FiFileText className="text-xl" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.queries}</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Post-discharge inquiries</p>
        </div>
      </div>

      {/* Analytics Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">CareLoop Operational Volume Analytics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Department / System Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Active Clinical Units</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-xs text-slate-800">Cardiology Recovery</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Post-stent & Angioplasty follow-up unit</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-xs text-slate-800">Orthopedics & Rehab</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Joint replacement and mobility tracking</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-xs text-slate-800">General Surgery Recovery</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Post-operative suture monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
