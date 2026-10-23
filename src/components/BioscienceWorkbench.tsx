/**
 * BioscienceWorkbench.tsx
 * Scientific Workbench for Type 2 Diabetes Biomarkers, Genomics & Pathways.
 * Adheres to Science Skills guidelines:
 *   - Clean scientific palette with high-contrast laboratory surfaces
 *   - Quick-try example pills (INS, GLUT4, TCF7L2, PPARG, KCNJ11)
 *   - Synchronized structural & pathway inspector
 *   - Epistemic provenance badges (PDB, UniProtKB, ClinVar)
 */

import React, { useState } from 'react';
import {
  Dna,
  ExternalLink,
  BookOpen,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface GeneVariantData {
  symbol: string;
  name: string;
  uniprot: string;
  pdbId: string;
  clinvarVariant: string;
  rsId: string;
  chromosome: string;
  mechanism: string;
  pathwayRole: string;
  clinicalImpact: string;
  provenance: string;
}

const BIOSCIENCE_TARGETS: Record<string, GeneVariantData> = {
  TCF7L2: {
    symbol: 'TCF7L2',
    name: 'Transcription Factor 7-Like 2',
    uniprot: 'Q9NQB0',
    pdbId: '2LEF',
    clinvarVariant: 'rs7903146 (Intron 4 C>T)',
    rsId: 'rs7903146',
    chromosome: '10q25.2-q25.3',
    mechanism:
      'Wnt signaling effector in pancreatic beta cells. The risk allele (T) enhances open chromatin accessibility, altering alternate splicing and impairing proinsulin processing and GLP-1-mediated incretin response.',
    pathwayRole: 'Wnt/β-catenin Signaling & Incretin Response',
    clinicalImpact: 'Strongest known common polygenic risk allele for T2D (OR ≈ 1.37 per T-allele).',
    provenance: '[Literature Curated & ClinVar Validated]',
  },
  PPARG: {
    symbol: 'PPARG',
    name: 'Peroxisome Proliferator-Activated Receptor Gamma',
    uniprot: 'P37231',
    pdbId: '1PRG',
    clinvarVariant: 'Pro12Ala (p.Pro12Ala / c.34C>G)',
    rsId: 'rs1801282',
    chromosome: '3p25.2',
    mechanism:
      'Nuclear hormone receptor governing adipogenesis, fatty acid uptake, and insulin-sensitizing adipokine secretion (Adiponectin). Target of thiazolidinediones (TZDs).',
    pathwayRole: 'Adipocyte Differentiation & Lipid Homeostasis',
    clinicalImpact: 'The Ala variant confers moderate insulin sensitization (OR ≈ 0.86, protective).',
    provenance: '[Experimentally Determined 3D X-Ray]',
  },
  KCNJ11: {
    symbol: 'KCNJ11',
    name: 'Potassium Inwardly-Rectifying Channel Subunit Kir6.2',
    uniprot: 'Q14654',
    pdbId: '6BAA',
    clinvarVariant: 'E23K (p.Glu23Lys / c.67G>A)',
    rsId: 'rs5219',
    chromosome: '11p15.1',
    mechanism:
      'Forms the pore-forming subunit of ATP-sensitive potassium (K_ATP) channel in beta cells. ATP/ADP ratio changes trigger closure, membrane depolarization, and voltage-gated calcium influx driving insulin exocytosis.',
    pathwayRole: 'Beta-Cell Stimulus-Secretion Coupling',
    clinicalImpact: 'Lys variant decreases ATP sensitivity, reducing basal insulin response.',
    provenance: '[Cryo-EM Experimental Structure]',
  },
  SLC2A4: {
    symbol: 'SLC2A4',
    name: 'Glucose Transporter Type 4 (GLUT-4)',
    uniprot: 'P14672',
    pdbId: '7WSM',
    clinvarVariant: 'Canonical Transporter',
    rsId: 'Transporter Gene',
    chromosome: '17p13.1',
    mechanism:
      'Facilitated glucose transporter sequestered in intracellular vesicles (GSVs) in skeletal muscle and adipose tissue. Translocates to plasma membrane upon Akt activation or muscular contraction (exercise).',
    pathwayRole: 'Insulin-Mediated & Exercise-Induced Glucose Disposal',
    clinicalImpact: 'Rate-limiting bottleneck in peripheral muscle glucose clearance.',
    provenance: '[Cryo-EM Experimental Structure]',
  },
  INS: {
    symbol: 'INS',
    name: 'Human Insulin Hormone',
    uniprot: 'P01308',
    pdbId: '4INS',
    clinvarVariant: 'Secretory Hexamer',
    rsId: 'Endocrine Peptide',
    chromosome: '11p15.5',
    mechanism:
      'Synthesized as preproinsulin, cleaved into A and B chains linked by two disulfide bonds. Stored with zinc as hexamers; dissociates into bioactive monomers upon capillary release.',
    pathwayRole: 'Central Glycemic Homeostasis',
    clinicalImpact: 'Essential hormone governing anabolic storage and suppressing hepatic gluconeogenesis.',
    provenance: '[Hodgkin 1969 Landmark Crystallography]',
  },
};

interface BioscienceWorkbenchProps {
  patientGeneticMarker?: string;
}

export const BioscienceWorkbench: React.FC<BioscienceWorkbenchProps> = ({ patientGeneticMarker }) => {
  const initialKey = patientGeneticMarker && patientGeneticMarker.includes('PPARG')
    ? 'PPARG'
    : patientGeneticMarker && patientGeneticMarker.includes('KCNJ11')
    ? 'KCNJ11'
    : patientGeneticMarker && patientGeneticMarker.includes('SLC2A4')
    ? 'SLC2A4'
    : patientGeneticMarker && patientGeneticMarker.includes('INS')
    ? 'INS'
    : 'TCF7L2';
  const [selectedKey, setSelectedKey] = useState<string>(initialKey);
  const target = BIOSCIENCE_TARGETS[selectedKey];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Quick-Try Example Pills */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Bioscience & Molecular Genomics Workbench</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authoritative genomic targets, crystallographic structures, and insulin-glucose signaling pathways.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg">
            Science Skills Grounded
          </span>
        </div>

        {/* Quick-Try Example Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-slate-500 uppercase mr-1 shrink-0">Biomarkers:</span>
          {Object.keys(BIOSCIENCE_TARGETS).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition shrink-0 ${
                selectedKey === key
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Target Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Molecular Profile & Structure Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{target.symbol}</span>
                <h3 className="text-lg font-bold text-white">{target.name}</h3>
                <span className="text-xs text-slate-400 font-mono">Locus: {target.chromosome}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                {target.provenance}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase">UniProtKB</span>
                <p className="font-bold text-slate-200 mt-0.5">{target.uniprot}</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase">RCSB PDB</span>
                <p className="font-bold text-purple-400 mt-0.5">{target.pdbId}</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase">ClinVar / Variant</span>
                <p className="font-bold text-amber-400 mt-0.5 truncate">{target.rsId}</p>
              </div>
            </div>

            <div className="text-xs space-y-2 pt-2">
              <div>
                <span className="font-semibold text-slate-300">Biochemical Mechanism:</span>
                <p className="text-slate-400 mt-0.5 leading-relaxed">{target.mechanism}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-300">Clinical Impact on Virtual Twin:</span>
                <p className="text-cyan-300 mt-0.5 leading-relaxed">{target.clinicalImpact}</p>
              </div>
            </div>
          </div>

          {/* Canonical Insulin Cascade Diagram */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Intracellular GLUT-4 Translocation Pathway
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                1. Insulin / INSR Binding
              </span>
              <span className="text-slate-600">→</span>
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                2. IRS-1 Tyr Phosphorylation
              </span>
              <span className="text-slate-600">→</span>
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                3. PI3K Activation
              </span>
              <span className="text-slate-600">→</span>
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                4. Akt / PKB Phosphorylation
              </span>
              <span className="text-slate-600">→</span>
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold rounded-lg">
                5. GLUT-4 Vesicle Membrane Fusion
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1">
              *Physical muscle contraction (steps) activates AMPK, bypassing defective IRS-1 pathways to directly
              drive GLUT-4 translocation.*
            </p>
          </div>
        </div>

        {/* Right: Authoritative Outbound Links & Science Badges */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase font-mono tracking-wider">
              Authoritative Biological Databases
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Direct reference links to EMBL-EBI, RCSB Protein Data Bank, and NCBI ClinVar for deep genomic
              inspection:
            </p>

            <div className="space-y-2 pt-1 font-mono">
              <a
                href={`https://www.rcsb.org/structure/${target.pdbId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-cyan-400 transition"
              >
                <span>RCSB PDB ({target.pdbId})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://www.uniprot.org/uniprotkb/${target.uniprot}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-indigo-400 transition"
              >
                <span>UniProtKB ({target.uniprot})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://www.ncbi.nlm.nih.gov/snp/${target.rsId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-amber-400 transition"
              >
                <span>NCBI dbSNP ({target.rsId})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Glycated Hemoglobin (HbA1c):</span>
            <p>
              Irreversible non-enzymatic ketoamine Amadori product between glucose and β-globin N-terminal valine.
              Index of mean 90-day glycemic exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioscienceWorkbench;
