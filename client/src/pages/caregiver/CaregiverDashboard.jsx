import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiCalendar, FiFileText, FiShield, FiHeart } from 'react-icons/fi';

export const CaregiverDashboard = () => {
  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCaregiverAccess() {
      try {
        const res = await api.get('/caregiver/authorized-patients');
        if (res.success) {
          setAuthorizedPatients(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCaregiverAccess();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Caregiver Family Portal</h2>
        <p className="text-xs text-slate-500 mt-1">Authorized post-discharge instructions, medication regimens, and scheduled clinical visits</p>
      </div>

      <div className="space-y-4">
        {authorizedPatients.map(item => (
          <div key={item.access_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  Authorized Patient
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{item.patient_name}</h3>
                <span className="text-xs font-mono text-slate-500">Recovery ID: {item.recovery_id}</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                ✓ Full Permission Active
              </span>
            </div>

            {/* Discharge Plan Details */}
            {item.discharge ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Diagnosis</span>
                  <p className="font-semibold text-slate-800 mt-1">{item.discharge.diagnosis}</p>
                </div>
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100">
                  <span className="font-bold text-teal-800 uppercase text-[10px] block">Prescribed Medicines</span>
                  <p className="font-medium text-slate-800 mt-1 whitespace-pre-line">{item.discharge.medication_details}</p>
                </div>
                <div className="md:col-span-2 p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-900 uppercase text-[10px] block">Caregiver Action & Alert Guidelines</span>
                  <p className="font-medium text-slate-800 mt-1">{item.discharge.instructions}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-4 italic">No discharge records available.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
