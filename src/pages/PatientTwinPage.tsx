/**
 * GlucoTwin Patient Digital Twin Page
 * Comprehensive virtual patient interface fusing EHR and dynamic wearable telemetry.
 * Features:
 *   - Live stream replay engine (2-second interval, play/pause, scrub)
 *   - Static EHR clinical profile
 *   - Recharts dynamic continuous glucose monitoring with 180 mg/dL threshold
 *   - 2-Hour adverse spike risk gauge and high-risk clinical alert banner
 *   - What-If counterfactual scenario sliders (exercise, carbs, sleep, medication)
 *   - Top contributing feature attribution bar chart
 *   - Heart rate, HRV autonomic tone, sleep stages, and step counts
 *   - Procedural 3D Pancreas & Islet Digital Twin (Three.js PBR)
 *   - Molecular Genomics & Signaling Cascade Inspector (Bioscience Skills)
 *   - Gemini 3.8 Flash Clinical Co-pilot with Voice Briefing (TTS)
 *   - Google Maps Grounded Diabetes Care & Exercise Locator
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Activity,
  Heart,
  Moon,
  Footprints,
  Pill,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Flame,
  Info,
  Dna,
  Layers,
  MapPin,
  Bot,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { patientsAPI } from '../api/client';
import { ThreePancreasScene } from '../components/ThreePancreasScene';
import { BioscienceWorkbench } from '../components/BioscienceWorkbench';
import { GeminiCopilotChat } from '../components/GeminiCopilotChat';
import { GoogleMapsGrounding } from '../components/GoogleMapsGrounding';

export interface Reading {
  id: number;
  patient_id: number;
  timestamp: string;
  glucose: number;
  heart_rate: number;
  hrv: number;
  sleep_stage: string;
  steps: number;
}

export interface ContributingFeature {
  feature: string;
  display_name: string;
  value: number;
  importance: number;
  direction: 'increases_risk' | 'decreases_risk';
}

export interface PredictionData {
  patient_id: number;
  patient_name: string;
  current_glucose: number;
  predicted_event: boolean;
  risk_probability: number;
  risk_percentage: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  top_contributing_features: ContributingFeature[];
  plain_language_explanation: string;
  clinical_recommendation: string;
  timestamp: string;
}

export const PatientTwinPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id) || 1;

  // Active view tab
  const [activeTab, setActiveTab] = useState<'telemetry' | '3d' | 'genomics' | 'copilot' | 'maps'>('telemetry');

  // Data states
  const [patient, setPatient] = useState<any>(null);
  const [allReadings, setAllReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replay stream engine
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(2000); // 2 seconds per tick

  // Prediction states
  const [baselinePrediction, setBaselinePrediction] = useState<PredictionData | null>(null);
  const [whatIfPrediction, setWhatIfPrediction] = useState<PredictionData | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  // What-If sliders state
  const [whatIf, setWhatIf] = useState({
    extra_steps: 0,
    carb_intake_g: 0,
    sleep_hours_delta: 0,
    medication_taken: true,
  });

  // Fetch initial patient EHR and 24h readings
  useEffect(() => {
    let isMounted = true;
    const loadPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pData, rData, predData] = await Promise.all([
          patientsAPI.getById(patientId),
          patientsAPI.getReadings(patientId, 24),
          patientsAPI.predict(patientId),
        ]);

        if (isMounted) {
          setPatient(pData);
          setAllReadings(rData);
          const initIdx = Math.max(24, rData.length - 24);
          setCurrentIndex(initIdx);
          setBaselinePrediction(predData);
          setWhatIfPrediction(predData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load patient digital twin stream.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPatientData();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Replay ticker: advances stream every `speed` milliseconds
  useEffect(() => {
    if (!isPlaying || allReadings.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= allReadings.length - 1) {
          return 24; // restart with initial lookback
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, allReadings, speed]);

  // Handle What-If Counterfactual recalculation
  useEffect(() => {
    if (!patient) return;
    const timer = setTimeout(async () => {
      setWhatIfLoading(true);
      try {
        const res = await patientsAPI.whatIf(patientId, whatIf);
        setWhatIfPrediction(res);
      } catch (err) {
        console.error('What-If simulation error:', err);
      } finally {
        setWhatIfLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [whatIf, patientId, patient]);

  // Readings currently visible up to replay pointer
  const windowStart = Math.max(0, currentIndex - 48);
  const visibleReadings = allReadings.slice(windowStart, currentIndex + 1);
  const currentReading = allReadings[currentIndex] || visibleReadings[visibleReadings.length - 1];

  const isWhatIfActive =
    whatIf.extra_steps > 0 ||
    whatIf.carb_intake_g > 0 ||
    whatIf.sleep_hours_delta !== 0 ||
    !whatIf.medication_taken;

  const activePrediction = isWhatIfActive && whatIfPrediction ? whatIfPrediction : baselinePrediction;
  const isHighRisk = activePrediction?.risk_level === 'High';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Synchronizing Virtual Patient Twin Stream...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-center text-slate-300">
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Error Loading Twin</h2>
          <p className="text-xs text-slate-400 mt-2">{error || 'Patient not found'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Cohort
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header & Replay Control Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-16 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb & Patient Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
              title="Return to patient cohort"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white font-mono">{patient.name}</h1>
                <span className="text-xs font-mono text-slate-500">#{patient.id}</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Twin Stream Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {patient.age}y {patient.sex === 'F' ? 'Female' : 'Male'} • BMI {patient.bmi} • HbA1c {patient.hba1c}% • {patient.genetic_marker.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Replay Controls Dock */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800/80">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Replay' : 'Play Stream'}</span>
            </button>

            {/* Reset / Rewind */}
            <button
              onClick={() => setCurrentIndex(24)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Rewind to start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Scrub Slider */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={24}
                max={allReadings.length - 1}
                value={currentIndex}
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className="w-24 sm:w-36 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-400 min-w-[70px] text-right">
                {currentReading?.timestamp.split(' ')[1] || '--:--'}
              </span>
            </div>

            {/* Speed toggle */}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value={3000}>0.5x</option>
              <option value={2000}>1.0x (2s)</option>
              <option value={1000}>2.0x (1s)</option>
              <option value={400}>5.0x (Fast)</option>
            </select>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'telemetry'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Predictive Twin</span>
          </button>

          <button
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === '3d'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Organ & Islet Twin (Three.js)</span>
          </button>

          <button
            onClick={() => setActiveTab('genomics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'genomics'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Genomic Pathways & Targets (Science)</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'copilot'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Gemini Clinical Co-Pilot & Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'maps'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Care & Exercise Locator (Maps)</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* TAB 1: TELEMETRY & PREDICTIVE TWIN */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* High Risk Alert Banner */}
            {isHighRisk && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-rose-900/60 to-slate-900 border-2 border-rose-600/80 shadow-xl shadow-rose-950/50 animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-950">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-mono tracking-wider font-bold text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded">
                          Adverse Event Alert
                        </span>
                        <h2 className="text-base font-bold text-white">
                          Impending Glucose Spike (&gt;180 mg/dL) Predicted Within 2 Hours
                        </h2>
                      </div>
                      <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                        {activePrediction?.plain_language_explanation}
                      </p>
                      <p className="text-xs font-semibold text-emerald-300 mt-1.5 flex items-center gap-1.5">
                        <span>💡 Recommendation:</span> {activePrediction?.clinical_recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="self-end md:self-center shrink-0 px-4 py-2 bg-rose-900/60 border border-rose-700/80 rounded-xl text-center">
                    <span className="text-[10px] text-rose-300 uppercase tracking-widest font-mono">Spike Risk</span>
                    <p className="text-2xl font-black text-white font-mono">
                      {activePrediction?.risk_percentage}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Grid: Static EHR Profile & Digital Twin Risk Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Static EHR Summary Card */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
                      <Info className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-white text-sm">Static Electronic Health Record (EHR)</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">DPDP/HIPAA Anonymized</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Demographics</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {patient.age} years / {patient.sex === 'F' ? 'Female' : 'Male'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">BMI: {patient.bmi} kg/m²</p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Glycated HbA1c</span>
                    <p className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{patient.hba1c}%</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      eAG ≈ {Math.round(28.7 * patient.hba1c - 46.7)} mg/dL
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">T2D History</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{patient.diagnosis_years} Years</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Family History: {patient.family_history_flag ? 'Yes (Positive)' : 'None'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Genetic Allele</span>
                    <p className="text-xs font-semibold text-purple-400 font-mono mt-0.5 truncate">
                      {patient.genetic_marker.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{patient.genetic_marker}</p>
                  </div>
                </div>

                {/* Prescribed Medications */}
                <div className="mt-3.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800/60 flex items-center gap-2.5 text-xs">
                  <Pill className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      Prescribed Pharmacotherapy:
                    </span>{' '}
                    <span className="font-semibold text-slate-200">{patient.medications}</span>
                  </div>
                </div>
              </div>

              {/* Digital Twin 2-Hour Risk Gauge Card */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">2-Hour Spike Predictor</h3>
                      <p className="text-[10px] text-slate-400">Fused EHR + Wearable Model</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      activePrediction?.risk_level === 'High'
                        ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                        : activePrediction?.risk_level === 'Moderate'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {activePrediction?.risk_level} Risk
                  </span>
                </div>

                {/* Risk Gauge Circle */}
                <div className="py-4 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-slate-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={
                          (activePrediction?.risk_percentage || 0) > 65
                            ? '#f43f5e'
                            : (activePrediction?.risk_percentage || 0) > 35
                            ? '#f59e0b'
                            : '#10b981'
                        }
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (activePrediction?.risk_percentage || 0)) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white font-mono tracking-tight">
                        {activePrediction?.risk_percentage || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                        Probability
                      </span>
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <p className="text-xs font-semibold text-slate-300">
                      Risk of Glucose &gt; 180 mg/dL in next 2 hours
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Algorithm: GradientBoostingClassifier
                    </p>
                  </div>
                </div>

                {isWhatIfActive && (
                  <div className="p-2 bg-cyan-950/60 border border-cyan-800/80 rounded-xl text-center text-[11px] text-cyan-300 font-medium">
                    ⚡ Showing What-If Simulated Counterfactual
                  </div>
                )}
              </div>
            </div>

            {/* Live Replay Continuous Glucose Stream Chart (Recharts) */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">Continuous Glucose Monitor (CGM) Stream</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                      5-Minute Epochs
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualizing postprandial excursions, dawn phenomenon, and nocturnal dips. Target: 70–140 mg/dL.
                  </p>
                </div>

                {/* Current Glucose Readout */}
                <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Live Reading</span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-2xl font-bold font-mono ${
                          (currentReading?.glucose || 0) > 180
                            ? 'text-rose-400'
                            : (currentReading?.glucose || 0) > 140
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {currentReading?.glucose?.toFixed(1) || '--'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">mg/dL</span>
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-4">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Status</span>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">
                      {(currentReading?.glucose || 0) > 180
                        ? '⚠️ Above 180 (Spike)'
                        : (currentReading?.glucose || 0) > 140
                        ? '⚡ Elevated'
                        : '✓ Euglycemic Target'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recharts Area Chart with 180 mg/dL Threshold */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibleReadings} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(val) => val.split(' ')[1] || val}
                    />
                    <YAxis stroke="#64748b" fontSize={10} domain={[60, 240]} unit=" mg" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as Reading;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-mono text-slate-400">{data.timestamp}</p>
                              <p className="font-bold text-cyan-400 font-mono text-sm">
                                Glucose: {data.glucose} mg/dL
                              </p>
                              <p className="text-slate-300">Heart Rate: {data.heart_rate} bpm</p>
                              <p className="text-slate-300">HRV: {data.hrv} ms</p>
                              <p className="text-slate-300">Steps: {data.steps}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={180}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: 'Clinical Spike Threshold (180 mg/dL)',
                        fill: '#f43f5e',
                        fontSize: 11,
                        position: 'top',
                      }}
                    />
                    <ReferenceLine
                      y={140}
                      stroke="#eab308"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      label={{
                        value: 'Postprandial Upper Target (140 mg/dL)',
                        fill: '#eab308',
                        fontSize: 10,
                        position: 'insideBottomRight',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="glucose"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#glucoseGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Middle Grid: What-If Prospective Simulator & Feature Importance Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* What-If Counterfactual Digital Twin Panel */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Prospective "What-If" Counterfactual Twin</h3>
                        <p className="text-[10px] text-slate-400">Simulate behavioral and pharmacological interventions</p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setWhatIf({
                          extra_steps: 0,
                          carb_intake_g: 0,
                          sleep_hours_delta: 0,
                          medication_taken: true,
                        })
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4">
                    {/* 1. Extra Steps */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Footprints className="w-4 h-4 text-emerald-400" />
                          Postprandial Walking Activity
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{whatIf.extra_steps.toLocaleString()} steps
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10000}
                        step={500}
                        value={whatIf.extra_steps}
                        onChange={(e) => setWhatIf({ ...whatIf, extra_steps: Number(e.target.value) })}
                        className="w-full accent-emerald-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>Sedentary (0)</span>
                        <span>15m walk (1,500)</span>
                        <span>45m brisk walk (4,500+)</span>
                      </div>
                    </div>

                    {/* 2. Upcoming Carbs */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Flame className="w-4 h-4 text-amber-400" />
                          Upcoming Carbohydrate Ingestion
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          +{whatIf.carb_intake_g} grams carbs
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        step={5}
                        value={whatIf.carb_intake_g}
                        onChange={(e) => setWhatIf({ ...whatIf, carb_intake_g: Number(e.target.value) })}
                        className="w-full accent-amber-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>Low carb (0g)</span>
                        <span>Snack (25g)</span>
                        <span>High-carb meal (75g+)</span>
                      </div>
                    </div>

                    {/* 3. Sleep Delta */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Moon className="w-4 h-4 text-purple-400" />
                          Prior Night Sleep Delta
                        </span>
                        <span className="font-mono font-bold text-purple-400">
                          {whatIf.sleep_hours_delta > 0 ? `+${whatIf.sleep_hours_delta}h` : `${whatIf.sleep_hours_delta}h`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-3}
                        max={3}
                        step={0.5}
                        value={whatIf.sleep_hours_delta}
                        onChange={(e) => setWhatIf({ ...whatIf, sleep_hours_delta: Number(e.target.value) })}
                        className="w-full accent-purple-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>Deprived (-3h)</span>
                        <span>Baseline (0h)</span>
                        <span>Restorative (+3h)</span>
                      </div>
                    </div>

                    {/* 4. Medication Adherence */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Pill className="w-4 h-4 text-cyan-400" />
                        Medication Adherence
                      </span>
                      <button
                        type="button"
                        onClick={() => setWhatIf({ ...whatIf, medication_taken: !whatIf.medication_taken })}
                        className={`px-3 py-1 rounded-xl font-semibold border transition text-xs ${
                          whatIf.medication_taken
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {whatIf.medication_taken ? '✓ Prescribed Dose Taken' : '⚠️ Dose Missed'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* What-If Live Comparison Summary */}
                <div className="mt-5 p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      Simulated Twin Impact
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <div>
                        <span className="text-[10px] text-slate-400">Baseline Risk:</span>{' '}
                        <span className="font-mono font-bold text-slate-200">
                          {baselinePrediction?.risk_percentage}%
                        </span>
                      </div>
                      <span className="text-slate-600">→</span>
                      <div>
                        <span className="text-[10px] text-slate-400">Simulated:</span>{' '}
                        <span
                          className={`font-mono font-bold ${
                            (whatIfPrediction?.risk_percentage || 0) < (baselinePrediction?.risk_percentage || 0)
                              ? 'text-emerald-400'
                              : (whatIfPrediction?.risk_percentage || 0) > (baselinePrediction?.risk_percentage || 0)
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {whatIfPrediction?.risk_percentage || baselinePrediction?.risk_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delta Badge */}
                  {whatIfPrediction && baselinePrediction && (
                    <div
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 border ${
                        whatIfPrediction.risk_percentage < baselinePrediction.risk_percentage
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : whatIfPrediction.risk_percentage > baselinePrediction.risk_percentage
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {whatIfPrediction.risk_percentage < baselinePrediction.risk_percentage ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>
                            -{(baselinePrediction.risk_percentage - whatIfPrediction.risk_percentage).toFixed(1)}%
                          </span>
                        </>
                      ) : whatIfPrediction.risk_percentage > baselinePrediction.risk_percentage ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>
                            +{(whatIfPrediction.risk_percentage - baselinePrediction.risk_percentage).toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <span>No Change</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Contributing Factors Bar Chart */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Top Contributing Factors</h3>
                        <p className="text-[10px] text-slate-400">Algorithmic feature importance attribution</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      SHAP-Style
                    </span>
                  </div>

                  {/* Contributing Features List / Bars */}
                  <div className="space-y-3">
                    {activePrediction?.top_contributing_features.map((feat, idx) => {
                      const isRiskUp = feat.direction === 'increases_risk';
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium truncate max-w-[200px]">
                              {feat.display_name}
                            </span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-400 font-semibold">{feat.value}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  isRiskUp ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                                }`}
                              >
                                {isRiskUp ? '↑ Increases Risk' : '↓ Protective'}
                              </span>
                            </div>
                          </div>

                          {/* Bar Fill */}
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isRiskUp ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(12, feat.importance * 120))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-800/80 pt-3">
                  Features fused from both dynamic 5-minute telemetry (rate of rise, recent activity) and static EHR
                  (HbA1c, genetic variant burden).
                </p>
              </div>
            </div>

            {/* Bottom Grid: Autonomic Telemetry (Heart Rate, HRV, Sleep, Steps) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Heart Rate & HRV Chart */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <h3 className="font-bold text-white text-sm">Autonomic Tone: Heart Rate & HRV</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> HR: {currentReading?.heart_rate} bpm
                    </span>
                    <span className="text-indigo-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" /> HRV: {currentReading?.hrv} ms
                    </span>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visibleReadings} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(' ')[1]} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[20, 140]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      />
                      <Line type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={2} dot={false} name="HR (bpm)" />
                      <Line type="monotone" dataKey="hrv" stroke="#818cf8" strokeWidth={2} dot={false} name="HRV (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Steps & Sleep Architecture */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Physical Activity & Sleep Architecture</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400">Steps: {currentReading?.steps}</span>
                    <span className="text-purple-400 uppercase">Stage: {currentReading?.sleep_stage}</span>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleReadings} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(' ')[1]} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      />
                      <Bar dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} name="Steps (5m)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THREE.JS 3D ENDOCRINE & ISLET DIGITAL TWIN */}
        {activeTab === '3d' && (
          <ThreePancreasScene
            currentGlucose={currentReading?.glucose || 125}
            riskLevel={activePrediction?.risk_level || 'Low'}
            isSpikePredicted={activePrediction?.predicted_event || false}
          />
        )}

        {/* TAB 3: BIOSCIENCE GENOMIC PATHWAYS & TARGETS */}
        {activeTab === 'genomics' && (
          <BioscienceWorkbench patientGeneticMarker={patient?.genetic_marker} />
        )}

        {/* TAB 4: GEMINI CLINICAL COPILOT & VOICE BRIEFING */}
        {activeTab === 'copilot' && (
          <GeminiCopilotChat
            patientContext={{
              name: patient.name,
              id: patient.id,
              age: patient.age,
              sex: patient.sex,
              bmi: patient.bmi,
              hba1c: patient.hba1c,
              diagnosis_years: patient.diagnosis_years,
              medications: patient.medications,
              genetic_marker: patient.genetic_marker,
              current_glucose: currentReading?.glucose,
              current_hr: currentReading?.heart_rate,
              current_hrv: currentReading?.hrv,
              current_steps: currentReading?.steps,
              predicted_2h_spike_risk: activePrediction?.risk_percentage,
              risk_level: activePrediction?.risk_level,
              plain_explanation: activePrediction?.plain_language_explanation,
              recommendation: activePrediction?.clinical_recommendation,
            }}
          />
        )}

        {/* TAB 5: GOOGLE MAPS GROUNDED CARE & EXERCISE LOCATOR */}
        {activeTab === 'maps' && <GoogleMapsGrounding />}
      </main>
    </div>
  );
};

export default PatientTwinPage;
