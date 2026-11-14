import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiCalendar, FiFileText, FiMessageSquare, FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi';

export const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Discharge Form modal state
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dischargeSuccess, setDischargeSuccess] = useState('');

  // Query Resolution modal state
  const [resolvingQuery, setResolvingQuery] = useState(null);
  const [doctorResponse, setDoctorResponse] = useState('');

  const loadData = async () => {
    try {
      const [patRes, aptRes, qryRes] = await Promise.all([
        api.get('/patients'),
        api.get('/appointments'),
        api.get('/queries')
      ]);
      setPatients(patRes.data || []);
      setAppointments(aptRes.data || []);
      setQueries(qryRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDischarge = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/discharges', {
        patient_id: selectedPatientId,
        diagnosis,
        medication_details: medications,
        instructions
      });
      if (res.success) {
        setDischargeSuccess('Discharge plan created and QR Recovery Passport synchronized.');
        setShowDischargeModal(false);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed creating discharge');
    }
  };

  const handleResolveQuery = async (e) => {
    e.preventDefault();
    if (!resolvingQuery) return;
    try {
      const res = await api.put(`/queries/${resolvingQuery.query_id}/resolve`, {
        response: doctorResponse
      });
      if (res.success) {
        setResolvingQuery(null);
        setDoctorResponse('');
        loadData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctor Clinical Recovery Console</h2>
          <p className="text-xs text-slate-500 mt-1">Review assigned patients, issue digital discharge instructions, and resolve queries</p>
        </div>
        <button
          onClick={() => setShowDischargeModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
        >
          <FiPlus /> Issue Digital Discharge
        </button>
      </div>

      {dischargeSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
          <span>{dischargeSuccess}</span>
          <button onClick={() => setDischargeSuccess('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Assigned Patients</span>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">{patients.length}</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Upcoming Follow-Ups</span>
          <div className="text-3xl font-extrabold text-teal-600 mt-1">
            {appointments.filter(a => a.status === 'Scheduled').length}
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Patient Queries</span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            {queries.filter(q => q.status === 'Open').length}
          </div>
        </div>
      </div>

      {/* Assigned Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Discharged & Monitored Patients</h3>
          <span className="text-xs text-slate-500 font-medium">{patients.length} Registered</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Recovery ID</th>
                <th className="py-3 px-4">Gender & Contact</th>
                <th className="py-3 px-4">Discharge Status</th>
                <th className="py-3 px-4">Emergency Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map(p => (
                <tr key={p.patient_id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{p.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">{p.recovery_id}</td>
                  <td className="py-3.5 px-4">{p.gender} | {p.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    {p.is_discharged ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                        Discharged
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Inpatient
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{p.emergency_contact || 'None registered'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Queries Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Recovery Inquiries & Questions</h3>
        <div className="space-y-3">
          {queries.map(q => (
            <div key={q.query_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{q.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {q.status}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Patient: {q.patient_name}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-2">{q.description}</p>
                {q.response && (
                  <p className="text-xs text-emerald-700 mt-1 bg-emerald-50/80 p-2 rounded border border-emerald-100">
                    <span className="font-bold">Doctor Response:</span> {q.response}
                  </p>
                )}
              </div>
              {q.status !== 'Resolved' && (
                <button
                  onClick={() => setResolvingQuery(q)}
                  className="px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shrink-0 transition"
                >
                  Respond & Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Discharge Modal */}
      {showDischargeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Create Digital Discharge Plan</h3>
            <p className="text-xs text-slate-500 mb-4">Issues official recovery guidelines & attaches to QR Recovery Passport</p>

            <form onSubmit={handleCreateDischarge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} ({p.recovery_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Final Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Post-Percutaneous Coronary Intervention"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medication Instructions</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Dosage schedules, timings, and cautions"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post-Discharge Recovery Care Instructions</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Physical restrictions, wound care, red flags..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
                >
                  Issue Discharge Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Resolution Modal */}
      {resolvingQuery && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Respond to Patient Query</h3>
            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              "{resolvingQuery.description}"
            </p>
            <form onSubmit={handleResolveQuery} className="mt-4 space-y-3">
              <textarea
                required
                rows={4}
                placeholder="Type your medical response and clinical advice..."
                value={doctorResponse}
                onChange={(e) => setDoctorResponse(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingQuery(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
                >
                  Submit & Resolve Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
