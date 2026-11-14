import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { FiAward, FiCalendar, FiFileText, FiHeart, FiClock, FiPlus, FiAlertCircle } from 'react-icons/fi';

export const PatientDashboard = () => {
  const [patientData, setPatientData] = useState(null);
  const [passport, setPassport] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  // New query modal state
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [category, setCategory] = useState('Medication');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      const [patRes, aptRes, qryRes, passRes] = await Promise.all([
        api.get('/patients/pat-1'),
        api.get('/appointments'),
        api.get('/queries'),
        api.get('/qr/passport/pat-1')
      ]);
      setPatientData(patRes.data || null);
      setAppointments(aptRes.data || []);
      setQueries(qryRes.data || []);
      setPassport(passRes.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/queries', {
        category,
        description
      });
      if (res.success) {
        setShowQueryModal(false);
        setDescription('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Error submitting query');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-6 md:p-8 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded bg-teal-800/80 text-[11px] font-bold tracking-wide uppercase text-teal-200">
            CareLoop Post-Discharge Active Patient
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome back, {patientData?.full_name || 'Patient'}
          </h2>
          <p className="text-xs text-teal-100 mt-1">
            Recovery ID: <span className="font-mono font-bold bg-teal-800 px-2 py-0.5 rounded">{patientData?.recovery_id || 'CL-MYS-2026-00556'}</span>
          </p>
        </div>
        <button
          onClick={() => setShowQueryModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-teal-900 font-bold text-xs rounded-xl shadow-md hover:bg-teal-50 transition"
        >
          <FiPlus /> Ask Doctor a Question
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Recovery Passport Feature Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl mb-3">
            <FiAward />
          </div>
          <h3 className="font-bold text-base text-slate-800">Digital Recovery Passport</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Present this secure QR code at pharmacy checkouts or clinical triage for verified recovery history.
          </p>

          <div className="my-6 p-4 bg-teal-50/50 rounded-2xl border border-teal-100 shadow-inner flex flex-col items-center">
            {passport?.verification_url ? (
              <QRCodeSVG
                value={passport.verification_url}
                size={180}
                level="H"
                fgColor="#0f766e"
              />
            ) : (
              <div className="w-44 h-44 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
                Generating QR Passport...
              </div>
            )}
            <span className="text-[11px] font-mono font-bold text-teal-800 mt-3">
              {patientData?.recovery_id}
            </span>
          </div>

          <span className="text-[10px] text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-md border border-emerald-200">
            ✓ Cryptographically Hashed & Active
          </span>
        </div>

        {/* Discharge Summary Plan */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <FiFileText className="text-teal-600" /> Post-Discharge Care & Medications
            </h3>
            <span className="text-xs font-semibold text-slate-400">Issued by Hospital Team</span>
          </div>

          {patientData?.discharge ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold uppercase text-[10px] text-slate-500 block">Primary Diagnosis</span>
                <p className="font-semibold text-slate-800 mt-0.5">{patientData.discharge.diagnosis}</p>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                <span className="font-bold uppercase text-[10px] text-teal-700 block">Prescribed Recovery Medications</span>
                <p className="font-medium text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                  {patientData.discharge.medication_details}
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="font-bold uppercase text-[10px] text-amber-800 block">Doctor's Recovery Guidelines</span>
                <p className="font-medium text-slate-700 mt-1 leading-relaxed">
                  {patientData.discharge.instructions}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No formal discharge summary recorded yet.</p>
          )}

          {/* Follow-up Appointments List */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
              Upcoming Follow-Up Reviews
            </h4>
            <div className="space-y-2">
              {appointments.map(a => (
                <div key={a.appointment_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{a.reason}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Doctor: {a.doctor_name || 'Dr. Specialist'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-700">{a.appointment_date} at {a.appointment_time}</span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Query Submission Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Ask Your Recovery Team</h3>
            <p className="text-xs text-slate-500 mt-1">Submit questions regarding medications, symptoms or rehab exercises</p>
            <form onSubmit={handlePostQuery} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Medication">Medication & Side-Effects</option>
                  <option value="Wound Care">Suture & Wound Care</option>
                  <option value="Diet & Mobility">Diet & Mobility Guidelines</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question / Symptom Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what you are experiencing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQueryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
                >
                  Submit Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
