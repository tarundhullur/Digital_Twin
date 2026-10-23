/**
 * GlucoTwin Navbar
 * Clean clinical header with navigation, user profile, and synthetic safety badge.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, Cpu, Users, LogOut, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-slate-800 text-cyan-400 border-cyan-500/50'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent';
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white font-mono">
                    Gluco<span className="text-cyan-400">Twin</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                    T2D PoC
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-none">Virtual Patient Twin Platform</p>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition ${isActive(
                  '/'
                )}`}
              >
                <Users className="w-4 h-4" />
                <span>Patient Twins</span>
              </Link>
              <Link
                to="/metrics"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition ${isActive(
                  '/metrics'
                )}`}
              >
                <Cpu className="w-4 h-4" />
                <span>Model AI & Metrics</span>
              </Link>
            </nav>
          </div>

          {/* Right section: Badge & User */}
          <div className="flex items-center gap-4">
            {/* DPDP/HIPAA Synthetic Data Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-emerald-300 text-xs font-medium shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Synthetic data only – DPDP/HIPAA safe</span>
            </div>

            {/* User chip & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200 leading-tight">{user?.name || 'Dr. Sarah Chen'}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.role || 'Attending Physician'}</p>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
