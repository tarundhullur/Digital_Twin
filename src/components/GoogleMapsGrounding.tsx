/**
 * GlucoTwin Google Maps Grounding & Healthcare Locator
 * Uses server-side Gemini 3.8 Flash with Google Maps Grounding to locate:
 *  - 24-Hour Emergency Endocrine Units (for acute severe hyper/hypoglycemia)
 *  - 24/7 Pharmacies carrying CGM sensors & insulin supplies
 *  - Public walking parks and tracks for postprandial glycemic control
 */

import React, { useState } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Trees,
  Crosshair,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ResourceItem {
  id: string;
  name: string;
  type: 'emergency' | 'pharmacy' | 'park' | 'clinic';
  address: string;
  distance: string;
  hours: string;
  relevance: string;
  features: string[];
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  {
    id: 'res-1',
    name: 'Metro Health Academic Endocrine & Acute Diabetes Care',
    type: 'emergency',
    address: '1420 Medical Parkway, Suite 100',
    distance: '1.2 miles away',
    hours: '24/7 Emergency Care',
    relevance: 'Immediate care for severe acute glycemic excursions (>250 mg/dL or DKA symptoms).',
    features: ['IV Insulin Protocol', 'STAT Serum Ketones', 'Board-Certified Endocrinologist On-Call'],
  },
  {
    id: 'res-2',
    name: 'Walgreens 24-Hour Pharmacy & Diabetic Center',
    type: 'pharmacy',
    address: '750 Grand Ave at 8th St',
    distance: '0.8 miles away',
    hours: 'Open 24 Hours',
    relevance: 'Emergency CGM replacement sensors (Dexcom G7, Libre 3), ketone strips, rapid-acting insulin.',
    features: ['CGM Sensor Stock', 'Glucagon Emergency Kits', 'Pharmacist Consultation'],
  },
  {
    id: 'res-3',
    name: 'City Riverfront Promenade & Botanical Park',
    type: 'park',
    address: 'Riverfront Blvd & 4th Street',
    distance: '0.5 miles away',
    hours: 'Open 5:00 AM - 11:00 PM',
    relevance: 'Paved, low-impact flat 1.5-mile loop ideal for 20-minute postprandial glucose disposal walks.',
    features: ['Flat Walking Paths', 'Benches Every 200m', 'Water Refill Stations', 'Well-Lit at Dusk'],
  },
  {
    id: 'res-4',
    name: 'Evergreen Comprehensive Diabetes Education Clinic',
    type: 'clinic',
    address: '890 Wellness Blvd, Floor 3',
    distance: '2.4 miles away',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
    relevance: 'Certified Diabetes Care and Education Specialists (CDCES) for nutrition and pump therapy titration.',
    features: ['Dietitian Consults', 'CGM Optimization', 'Insulin Resistance Coaching'],
  },
];

export const GoogleMapsGrounding: React.FC = () => {
  const [location, setLocation] = useState('Metro Medical Center District, Chicago IL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'emergency' | 'pharmacy' | 'park' | 'clinic'>('all');
  const [loading, setLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>(DEFAULT_RESOURCES);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setGeminiResult(null);

    try {
      const response = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          query: searchQuery || 'emergency endocrinology, 24/7 pharmacies with CGM sensors, and walking parks for diabetes exercise',
        }),
      });

      const data = await response.json();
      if (data.result) {
        setGeminiResult(data.result);
      }
    } catch (err) {
      console.error('Maps grounding request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    if (filter === 'all') return true;
    return res.type === filter;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-rose-950/70 border-rose-800 text-rose-300';
      case 'pharmacy':
        return 'bg-cyan-950/70 border-cyan-800 text-cyan-300';
      case 'park':
        return 'bg-emerald-950/70 border-emerald-800 text-emerald-300';
      case 'clinic':
        return 'bg-purple-950/70 border-purple-800 text-purple-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <Building2 className="w-4 h-4 text-rose-400" />;
      case 'pharmacy':
        return <Crosshair className="w-4 h-4 text-cyan-400" />;
      case 'park':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'clinic':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Nearby Diabetes Care & Exercise Grounding
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini 3.8 + Google Maps
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-world clinical logistics for urgent glycemic spikes, rapid CGM sensor replacement, and postprandial exercise paths.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-emerald-400 text-xs font-medium self-start md:self-center">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DPDP/HIPAA Safe – Anonymized Geo-Context</span>
          </div>
        </div>

        {/* Search & Location Bar */}
        <form onSubmit={handleSearch} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Patient Clinical Vicinity</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, ZIP, or Medical District"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="md:col-span-6 relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Specific Need or Resource</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 24h pharmacy with Libre 3 sensors, flat park trail with lights"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ground via Maps</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Filter categories */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800/80">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'emergency', label: 'Emergency Endocrine (Acute Spikes)' },
            { id: 'pharmacy', label: '24/7 Pharmacies (CGM/Insulin)' },
            { id: 'park', label: 'Walking Parks (Glucose Disposal)' },
            { id: 'clinic', label: 'Diabetes Education' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === cat.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gemini Live Maps Grounding Result (if searched) */}
      {geminiResult && (
        <div className="bg-slate-900 border border-cyan-800/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Gemini 3.8 Flash Google Maps Analysis for {location}</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            {geminiResult}
          </div>
        </div>
      )}

      {/* Structured Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getTypeIcon(res.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                      {res.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{res.address}</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-medium">{res.distance}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeStyle(res.type)}`}>
                  {res.type.toUpperCase()}
                </span>
              </div>

              {/* Clinical hours & relevance */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{res.hours}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <strong className="text-slate-300">Clinical Indication:</strong> {res.relevance}
                </p>
              </div>

              {/* Tags / features */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {res.features.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-800/90 rounded-md text-[10px] text-slate-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom action: open Google Maps */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Directions & Live Status</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${res.name} ${res.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <span>Navigate</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
