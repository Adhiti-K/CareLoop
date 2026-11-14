import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUserPlus, FiCalendar, FiClock, FiSearch } from 'react-icons/fi';

export const ReceptionistDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Form states
  const [showAptModal, setShowAptModal] = useState(false);
  const [selectedPatId, setSelectedPatId] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('');
  const [reason, setReason] = useState('Routine post-discharge clinical checkup');

  const loadData = async () => {
    try {
      const [patRes, docRes, aptRes] = await Promise.all([
        api.get('/patients'),
        api.get('/doctors'),
        api.get('/appointments')
      ]);
      setPatients(patRes.data || []);
      setDoctors(docRes.data || []);
      setAppointments(aptRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookApt = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', {
        patient_id: selectedPatId,
        doctor_id: selectedDocId,
        appointment_date: aptDate,
        appointment_time: aptTime,
        reason
      });
      if (res.success) {
        setShowAptModal(false);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Error booking appointment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reception Desk & Scheduling</h2>
          <p className="text-xs text-slate-500 mt-1">Patient registration and automated follow-up appointment desk</p>
        </div>
        <button
          onClick={() => setShowAptModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
        >
          + Schedule Follow-up Appointment
        </button>
      </div>

      {/* Appointment List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Scheduled Follow-up Reviews</h3>
          <span className="text-xs text-slate-500">{appointments.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Recovery ID</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map(a => (
                <tr key={a.appointment_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-teal-800">{a.appointment_date} @ {a.appointment_time}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{a.patient_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{a.recovery_id}</td>
                  <td className="py-3 px-4">{a.doctor_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showAptModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Book Patient Follow-up</h3>
            <form onSubmit={handleBookApt} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient</label>
                <select
                  required
                  value={selectedPatId}
                  onChange={(e) => setSelectedPatId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>{p.full_name} ({p.recovery_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor</label>
                <select
                  required
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>{d.full_name} ({d.department_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAptModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
