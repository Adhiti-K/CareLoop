import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiActivity, FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demoPass123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route to user's assigned dashboard
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="w-12 h-12 rounded-xl bg-teal-500 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-teal-500/30 mb-3">
            <FiActivity />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">CareLoop Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your authorized clinical workspace</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <FiAlertCircle className="shrink-0 text-sm" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg shadow-md shadow-teal-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Switch Role Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor@careloop.local')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded font-semibold text-slate-700 transition"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('patient@careloop.local')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded font-semibold text-slate-700 transition"
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('nurse@careloop.local')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded font-semibold text-slate-700 transition"
              >
                Nurse
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@careloop.local')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded font-semibold text-slate-700 transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('receptionist@careloop.local')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded font-semibold text-slate-700 transition"
              >
                Reception
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('caregiver@careloop.local')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded font-semibold text-slate-700 transition"
              >
                Caregiver
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Discharged patient needing access?{' '}
            <Link to="/register" className="text-teal-600 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
