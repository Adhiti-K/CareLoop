import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiCalendar, FiFileText, FiCheckCircle } from 'react-icons/fi';

export const NurseDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, aptRes] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments')
        ]);
        setPatients(patRes.data || []);
        setAppointments(aptRes.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Nurse Care & Handover Station</h2>
        <p className="text-xs text-slate-500 mt-1">Assist post-operative care, discharge procedures, and family handover instructions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Monitored Inpatients & Discharges</span>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">{patients.length}</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Upcoming Nursing Follow-ups</span>
          <div className="text-3xl font-extrabold text-teal-600 mt-1">{appointments.length}</div>
        </div>
      </div>

      {/* Patients Care Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Active Recovery Monitoring</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Recovery ID</th>
                <th className="py-3 px-4">Emergency Contact</th>
                <th className="py-3 px-4">Clinical Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map(p => (
                <tr key={p.patient_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{p.full_name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">{p.recovery_id}</td>
                  <td className="py-3 px-4">{p.emergency_contact || 'N/A'}</td>
                  <td className="py-3 px-4 text-slate-700">{p.discharge_summary?.diagnosis || 'Inpatient Assessment'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
