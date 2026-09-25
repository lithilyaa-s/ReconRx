import React from 'react';
import { 
  HelpCircle, 
  ShieldCheck, 
  Sparkles, 
  GitCompare, 
  AlertTriangle, 
  FileCheck2, 
  CheckCircle2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpPage: React.FC = () => {
  const steps = [
    { num: '01', title: 'Consolidate', desc: 'Ingest previous prescriptions, outpatient summaries, and hospital order sheets.' },
    { num: '02', title: 'Compare', desc: 'Deterministic matching normalizes brands, units, formulations, and schedules.' },
    { num: '03', title: 'Understand', desc: 'AI observes discrepancies and cross-references 80 trained DrugBank interaction rules.' },
    { num: '04', title: 'Review', desc: 'Clinician reviews each flagged issue with rich pharmacological rationale.' },
    { num: '05', title: 'Resolve', desc: 'Record clinical justification (e.g. intentional hold, dose change, or substitution).' },
    { num: '06', title: 'Finalize', desc: 'Generate verified, locked transition orders with a complete audit sign-off.' },
  ];

  const faqs = [
    {
      q: 'Does ReconRx prescribe or modify medication orders automatically?',
      a: 'No. ReconRx is strictly a Clinical Decision Support (CDS) copilot. It flags potential discrepancies and pharmacological risks for human clinical review. Final decisions must always remain with the licensed healthcare professional.'
    },
    {
      q: 'How does ReconRx detect Drug-Drug Interactions (DDIs)?',
      a: 'ReconRx is pre-trained with 80 high-severity interaction rules from DrugBank and Micromedex. When medications are co-administered, it computes pharmacokinetic (CYP450 inhibition/induction) and pharmacodynamic (additive bleeding, CNS depression, QTc prolongation) conflict risks.'
    },
    {
      q: 'What is the definition of a Potential Omission?',
      a: 'A potential omission is flagged when a chronic or ongoing medication present in pre-admission records is completely absent from inpatient admission orders without an intentional hold order.'
    },
    {
      q: 'What is Review Progress / Reconciliation Completeness?',
      a: 'Review Progress measures task completion—i.e., how many flagged care-transition discrepancies have been reviewed and actioned by the clinician. It is explicitly a workflow completion indicator, NOT a patient safety score.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Clinical Decision Support Guide</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Understanding the ReconRx workflow, discrepancy types, and clinical safety standards.
        </p>
      </div>

      {/* Hero Mission Card */}
      <div className="bg-navy-900 text-white p-6 md:p-8 rounded-2xl shadow-card relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles size={14} className="text-brand-400" />
            <span>NPSG 03.06.01 Medication Safety Principle</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            “Before the medication list is finalized, make sure important changes don't go unnoticed.”
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light">
            ReconRx bridges the dangerous care-transition gap between hospital admission, ward transfer, and patient discharge.
          </p>
        </div>
      </div>

      {/* 6-Step Workflow */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">The 6-Step Reconciliation Workflow</h2>
          <p className="text-xs text-slate-500 mt-0.5">How healthcare professionals move from fragmented records to verified clarity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
              <span className="font-mono text-xs font-extrabold text-brand-600 block mb-1">{s.num}</span>
              <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Discrepancy Types Taxonomy */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Discrepancy Taxonomy & Severity Tiers</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <span className="font-bold text-rose-800 block text-sm">Potential Omission (Critical)</span>
            <p className="text-rose-900/80 mt-1">
              Drug was active prior to admission but missing from current orders. Risk of rebound decompensation (e.g. statin or beta-blocker cessation).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
            <span className="font-bold text-amber-800 block text-sm">Dose & Frequency Shifts (Major)</span>
            <p className="text-amber-900/80 mt-1">
              Strength or interval modified across care settings. Requires verification of patient renal function or therapeutic target.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
            <span className="font-bold text-purple-800 block text-sm">Drug-Drug Interaction (Critical / Major)</span>
            <p className="text-purple-900/80 mt-1">
              Co-prescription of interacting medications (e.g. Warfarin + NSAID bleeding risk). Recommends safer alternative and close monitoring.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="font-bold text-blue-800 block text-sm">Newly Added Therapy (Moderate)</span>
            <p className="text-blue-900/80 mt-1">
              Medication initiated during inpatient stay. Requires confirmation against discharge plan and allergy profile.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>

        <div className="divide-y divide-slate-100 space-y-3 pt-1">
          {faqs.map((f, i) => (
            <div key={i} className="pt-3 first:pt-0">
              <h3 className="font-bold text-slate-900 text-xs md:text-sm">{f.q}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
