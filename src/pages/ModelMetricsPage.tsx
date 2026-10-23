/**
 * GlucoTwin Model Metrics & Transparency Page
 * Evaluates the fused GradientBoostingClassifier on the out-of-time test split.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Award,
  CheckCircle2,
  TrendingUp,
  Layers,
  Database,
  ShieldCheck,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { modelAPI } from '../api/client';

export interface ModelMetrics {
  model_name: string;
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  trained_at: string;
  feature_importances: Record<string, number>;
}

export const ModelMetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await modelAPI.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch model metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const featureChartData = metrics
    ? Object.entries(metrics.feature_importances).map(([name, imp]) => ({
        name: name
          .replace(/_/g, ' ')
          .replace('2h', '2h window')
          .replace('last', 'latest')
          .replace('std', 'variability'),
        importance: Math.round(imp * 1000) / 10, // percentage with 1 decimal
        rawImportance: imp,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                Model Evaluation & Explainability
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Out-of-Time Verified
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Validation metrics and SHAP-aligned feature attribution for the GlucoTwin 2-hour adverse spike classifier.
            </p>
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading model performance matrices...</p>
          </div>
        ) : error || !metrics ? (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-sm">
            {error || 'Unable to load metrics'}
          </div>
        ) : (
          <>
            {/* Top Stat KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">ROC-AUC Score</span>
                <p className="mt-1 text-2xl font-bold text-cyan-400 font-mono">
                  {(metrics.roc_auc * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Discrimination power</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Accuracy</span>
                <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Overall classification</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Precision</span>
                <p className="mt-1 text-2xl font-bold text-indigo-400 font-mono">
                  {(metrics.precision * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Low false alarms</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Recall / Sensitivity</span>
                <p className="mt-1 text-2xl font-bold text-amber-400 font-mono">
                  {(metrics.recall * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Spike event capture</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">F1 Balance</span>
                <p className="mt-1 text-2xl font-bold text-purple-400 font-mono">
                  {(metrics.f1_score * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Harmonic mean</p>
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-white">Feature Importance Hierarchy</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Relative contribution of fused static EHR markers and dynamic 2-hour sliding window telemetry.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">Gini Impurity Reduction (%)</span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureChartData.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} unit="%" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      formatter={(val: any) => [`${val}%`, 'Relative Importance']}
                    />
                    <Bar dataKey="importance" fill="#06b6d4" radius={[0, 6, 6, 0]}>
                      {featureChartData.slice(0, 10).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#06b6d4' : index === 1 ? '#38bdf8' : '#818cf8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Training Methodology & Dataset Split */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dataset Architecture */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Time-Partitioned Cohort</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Constructed from 20 synthetic patients with 14 days of continuous 5-minute CGM readings (80,640 records).
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Train Window (Days 1–10):</span>
                    <span className="text-cyan-400 font-bold">{metrics.train_samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Test Window (Days 11–14):</span>
                    <span className="text-emerald-400 font-bold">{metrics.test_samples.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Total Sample Windows:</span>
                    <span className="text-white font-bold">{metrics.total_samples.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* No-Leakage Temporal Split */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Strict Zero-Leakage Split</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Standard random cross-validation leaks temporal trajectory patterns across 5-minute intervals. GlucoTwin
                  enforces strict out-of-time chronological partitioning:
                </p>
                <ul className="mt-3 text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Features extracted solely from $T-2h$ to $T$.</li>
                  <li>Target label: Max glucose in $T$ to $T+2h &gt; 180$ mg/dL.</li>
                  <li>Evaluation performed exclusively on unseen future 4 days.</li>
                </ul>
              </div>

              {/* Algorithmic Details */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Algorithmic Formulation</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-mono text-[10px]">Algorithm:</span>
                    <p className="font-semibold text-slate-200">{metrics.algorithm}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-mono text-[10px]">Lookback Window:</span>
                    <p className="font-semibold text-slate-200">2 Hours (24 points at 5-min intervals)</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-mono text-[10px]">Prediction Horizon:</span>
                    <p className="font-semibold text-slate-200">2 Hours ahead (Threshold &gt; 180 mg/dL)</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-mono text-[10px]">Last Retrained:</span>
                    <p className="font-mono text-cyan-400 text-[11px]">{metrics.trained_at}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ModelMetricsPage;
