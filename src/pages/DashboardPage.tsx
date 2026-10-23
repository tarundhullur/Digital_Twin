/**
 * GlucoTwin Dashboard Page
 * Overview of 20 synthetic Type 2 Diabetes virtual patients with real-time risk stratification.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Dna,
  Pill,
  ArrowRight,
  TrendingUp,
  Activity,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { patientsAPI } from '../api/client';

export interface Patient {
  id: number;
  name: string;
  age: number;
  sex: string;
  bmi: number;
  hba1c: number;
  diagnosis_years: number;
  family_history_flag: number;
  genetic_marker: string;
  medications: string;
  latest_glucose?: number;
  risk_level?: 'Low' | 'Moderate' | 'High';
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'High' | 'Moderate' | 'Low'>('All');

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patientsAPI.getAll();
      setPatients(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch virtual patients. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genetic_marker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.medications.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = riskFilter === 'All' || p.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const highRiskCount = patients.filter((p) => p.risk_level === 'High').length;
  const modRiskCount = patients.filter((p) => p.risk_level === 'Moderate').length;
  const lowRiskCount = patients.filter((p) => p.risk_level === 'Low').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                Virtual Patient Cohort
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                20 Twins Active
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Real-time physiological streaming and 2-hour adverse hyperglycemia spike prediction (&gt;180 mg/dL).
            </p>
          </div>

          <button
            onClick={fetchPatients}
            disabled={loading}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Cohort</span>
          </button>
        </div>

        {/* Clinical Cohort Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Virtual Twins</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white font-mono">{patients.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Synthetic T2D cohort</p>
          </div>

          <div className="bg-slate-900/80 border border-rose-900/40 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-300">Impending Spike Risk</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-400 font-mono">{highRiskCount}</p>
            <p className="text-[11px] text-rose-400/70 mt-1">&gt; 65% probability of &gt;180 mg/dL</p>
          </div>

          <div className="bg-slate-900/80 border border-amber-900/40 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-300">Moderate Vigilance</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-400 font-mono">{modRiskCount}</p>
            <p className="text-[11px] text-amber-400/70 mt-1">35% – 65% probability range</p>
          </div>

          <div className="bg-slate-900/80 border border-emerald-900/40 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-300">Well-Controlled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{lowRiskCount}</p>
            <p className="text-[11px] text-emerald-400/70 mt-1">&lt; 35% probability of excursion</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, marker, or drug..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
            {(['All', 'High', 'Moderate', 'Low'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                  riskFilter === level
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {level === 'All' ? 'All Patients' : `${level} Risk`}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchPatients} className="text-xs underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Patient Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading virtual twin streams...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 p-8">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No matching virtual patients</p>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search or risk filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPatients.map((patient) => {
              const isHigh = patient.risk_level === 'High';
              const isMod = patient.risk_level === 'Moderate';

              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl transition duration-200 cursor-pointer shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition">
                            {patient.name}
                          </h3>
                          <span className="text-xs text-slate-500 font-mono">#{patient.id}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {patient.age}y • {patient.sex === 'F' ? 'Female' : 'Male'} • BMI {patient.bmi}
                        </p>
                      </div>

                      {/* Risk Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isHigh
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
                            : isMod
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        }`}
                      >
                        {isHigh ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : isMod ? (
                          <Activity className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>{patient.risk_level} Risk</span>
                      </span>
                    </div>

                    {/* Clinical Stream Highlights */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          Current Glucose
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span
                            className={`text-lg font-bold font-mono ${
                              (patient.latest_glucose || 0) > 180
                                ? 'text-rose-400'
                                : (patient.latest_glucose || 0) > 140
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {patient.latest_glucose || '--'}
                          </span>
                          <span className="text-[10px] text-slate-500">mg/dL</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          Static HbA1c
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span
                            className={`text-lg font-bold font-mono ${
                              patient.hba1c >= 8.0
                                ? 'text-rose-400'
                                : patient.hba1c >= 7.0
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {patient.hba1c}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({patient.diagnosis_years}y T2D)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Genetic Marker & Medications */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Dna className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate text-slate-300 font-mono text-[11px]">
                          {patient.genetic_marker}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Pill className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-[11px] text-slate-400">
                          {patient.medications}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition">
                    <span>Inspect Digital Twin</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
