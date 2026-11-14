import React from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiShield, FiCalendar, FiFileText, FiAward, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <FiActivity className="text-2xl" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">CARELOOP</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded">
                Smart Post-Discharge System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/verify-passport"
              className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition"
            >
              Verify Passport
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold px-4 py-2 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-600/20 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-6">
          <FiShield /> Certified Healthcare Continuity & Patient Safety
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Bridging Hospital Discharge with <br />
          <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            Continuous Home Recovery
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          CareLoop synchronizes hospitals, doctors, patients, and caregivers with digital discharge plans, QR-based Recovery Passports, and automated follow-up appointment tracking.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/30 transition transform hover:-translate-y-0.5"
          >
            Access Portal <FiArrowRight />
          </Link>
          <Link
            to="/verify-passport"
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-300 hover:border-teal-500 text-slate-700 font-bold rounded-xl shadow-xs transition"
          >
            Scan Recovery QR
          </Link>
        </div>
      </section>

      {/* 5 Core Feature Cards */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">5 Pillars of Post-Discharge Safety</h2>
            <p className="text-slate-600 text-sm mt-2">Comprehensive lifecycle protection for discharged patients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl mb-4">
                <FiAward />
              </div>
              <h3 className="font-bold text-lg text-slate-800">QR Recovery Passport</h3>
              <p className="text-slate-600 text-sm mt-2">
                Cryptographically hashed QR code granting instant authorized access to recovery summaries and emergency contacts during triage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                <FiCalendar />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Automated Follow-ups</h3>
              <p className="text-slate-600 text-sm mt-2">
                Smart reminder crons notify patients 24 hours prior and automatically flag missed reviews to prevent clinical relapse.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-4">
                <FiFileText />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Digital Discharge Care</h3>
              <p className="text-slate-600 text-sm mt-2">
                Doctor-authored discharge instructions, exact medication doses, and caregiver handover authorization protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs text-center">
        <p>&copy; 2026 CARELOOP - Smart Post-Discharge Patient Care and Recovery Management System. VTU Engineering Mini-Project.</p>
      </footer>
    </div>
  );
};
