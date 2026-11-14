import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiCheckCircle, FiAlertTriangle, FiActivity, FiCalendar, FiUser, FiPhone, FiHospital } from 'react-icons/fi';

export const VerifyPassportPage = () => {
  const { token } = useParams();
  const [inputToken, setInputToken] = useState(token || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (tokenToTest) => {
    const activeToken = tokenToTest || inputToken;
    if (!activeToken) return;

    setError('');
    setData(null);
    setLoading(true);

    try {
      const res = await api.get(`/qr/verify/${activeToken}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Passport verification failed. Invalid token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-teal-700 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white text-teal-700 mx-auto flex items-center justify-center text-2xl shadow-md mb-2">
            <FiActivity />
          </div>
          <h2 className="text-xl font-bold">Digital Recovery Passport Verification</h2>
          <p className="text-xs text-teal-100 mt-1">Official Hospital Triage & Emergency Verification Portal</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Search / Scan Token input */}
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="Enter recovery passport token or scan URL..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {/* Quick Demo Token Button */}
          {!data && !error && (
            <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl mb-6">
              <p className="text-xs text-slate-500 mb-2">Testing Triage Scanning?</p>
              <button
                onClick={() => {
                  setInputToken('CL_TOKEN_PAT1_SECURE992837');
                  handleVerify('CL_TOKEN_PAT1_SECURE992837');
                }}
                className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1.5 rounded-lg hover:bg-teal-200 transition"
              >
                Load Sample Discharged Patient Token
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
              <FiAlertTriangle className="text-2xl shrink-0 text-rose-500" />
              <div>
                <p className="font-bold">Verification Failed</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
                <FiCheckCircle className="text-3xl text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">AUTHENTIC RECOVERY PASSPORT VERIFIED</p>
                  <p className="text-xs text-emerald-700">Authenticated via CareLoop Cryptographic Token Registry</p>
                </div>
              </div>

              {/* Passport Card Info */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Recovery ID</span>
                  <span className="font-mono font-bold text-teal-700">{data.recovery_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Patient Name</span>
                  <span className="font-semibold text-slate-800">{data.patient_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Discharging Hospital</span>
                  <span className="text-slate-700 font-medium">{data.hospital}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Discharge Date</span>
                  <span className="text-slate-700">{data.discharge_date}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Diagnosis / Condition</span>
                  <span className="text-slate-800 font-medium text-right max-w-xs">{data.diagnosis}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Emergency Contact</span>
                  <span className="text-rose-600 font-bold">{data.emergency_contact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Next Scheduled Review</span>
                  <span className="text-teal-800 font-semibold">{data.next_appointment}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center italic">
                Timestamp of verification: {new Date(data.verified_at).toLocaleString()}
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-xs text-teal-600 font-semibold hover:underline">
              ← Return to CareLoop Portal Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
