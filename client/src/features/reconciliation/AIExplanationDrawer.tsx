import React from 'react';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { DiscrepancyItem, ResolutionAction } from '../../types';

interface AIExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  discrepancy: DiscrepancyItem | null;
  onResolve: (action: ResolutionAction, rationale: string) => void;
}

export const AIExplanationDrawer: React.FC<AIExplanationDrawerProps> = ({
  isOpen,
  onClose,
  discrepancy,
  onResolve
}) => {
  if (!isOpen || !discrepancy) return null;

  const isDDI = discrepancy.type === 'DRUG_DRUG_INTERACTION';
  const isOmission = discrepancy.type === 'POTENTIAL_OMISSION';
  const isDoseChange = discrepancy.type === 'DOSE_CHANGE' || discrepancy.type === 'DOSE_FREQUENCY_CHANGE';
  const isNew = discrepancy.type === 'NEW_MEDICATION';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">AI Review Assistant</h2>
              <p className="text-xs text-slate-500">Clinical Decision Support Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Target Medication Header */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Flagged Medication</span>
              <h3 className="text-base font-bold text-slate-900">{discrepancy.medicationName}</h3>
              {discrepancy.genericName && (
                <span className="text-xs text-slate-500 italic">Generic: {discrepancy.genericName}</span>
              )}
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              discrepancy.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              discrepancy.severity === 'Major' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {discrepancy.severity}
            </span>
          </div>

          {/* Section 1: What Changed? */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={14} className="text-brand-600" />
              1. What Changed?
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-500 block mb-1 text-[11px]">Previous Record</span>
                {discrepancy.previousRecord ? (
                  <div className="space-y-0.5 text-slate-800">
                    <p className="font-medium">{discrepancy.previousRecord.dose || 'Standard'}</p>
                    <p className="text-slate-500">{discrepancy.previousRecord.frequency || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{discrepancy.previousRecord.sourceName || 'Outpatient Rx'}</p>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Not found in prior record</span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-500 block mb-1 text-[11px]">Current Record</span>
                {discrepancy.currentRecord ? (
                  <div className="space-y-0.5 text-slate-800">
                    <p className="font-medium">{discrepancy.currentRecord.dose || 'Standard'}</p>
                    <p className="text-slate-500">{discrepancy.currentRecord.frequency || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{discrepancy.currentRecord.prescriber || 'Current Order'}</p>
                  </div>
                ) : (
                  <span className="text-rose-600 font-medium">Not Found (Omitted)</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Why Was It Flagged? */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={14} className="text-brand-600" />
              2. Why Was It Flagged?
            </h4>
            <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
              {discrepancy.aiObservation}
            </div>
          </div>

          {/* Section 3: Clinical Explanation & Mechanism */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-brand-600" />
              3. Clinical Rationale & Impact
            </h4>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {discrepancy.clinicalExplanation}
            </div>
          </div>

          {/* Section 4: If DDI, show Pharmacological Reference & Mechanism */}
          {discrepancy.ddiDetails && (
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                <BookOpen size={14} className="text-purple-600" />
                <span>DrugBank / Micromedex Clinical Pharmacology</span>
              </div>
              <div className="text-[11px] text-purple-950 space-y-1">
                <p><span className="font-semibold">Mechanism:</span> {discrepancy.ddiDetails.mechanism}</p>
                <p><span className="font-semibold">Safer Alternative:</span> <span className="font-bold text-emerald-800">{discrepancy.ddiDetails.safer_alternative}</span></p>
                <p className="text-[10px] text-purple-700 mt-1 italic">Ref: {discrepancy.ddiDetails.reference}</p>
              </div>
            </div>
          )}

          {/* Section 5: Suggested Review Action */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle size={14} className="text-brand-600" />
              4. Recommended Clinical Review Action
            </h4>
            <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 leading-relaxed font-medium">
              {discrepancy.suggestedAction}
            </div>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-start space-x-2 text-[11px] text-slate-500">
            <ShieldAlert size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p>
              <strong className="text-slate-700">Clinical Decision Support:</strong> AI-generated observation. ReconRx does not prescribe or modify medications. Final clinical decisions must always remain with the healthcare professional.
            </p>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Select Clinical Resolution</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {isOmission ? (
              <>
                <button
                  onClick={() => {
                    onResolve('ADD_TO_CURRENT', 'Confirmed omission. Re-ordered to inpatient medication sheet.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-colors text-center"
                >
                  Add to Current Meds
                </button>
                <button
                  onClick={() => {
                    onResolve('CONFIRM_DISCONTINUED', 'Confirmed intentionally held/discontinued by physician.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors text-center"
                >
                  Confirm Discontinued
                </button>
              </>
            ) : isDoseChange ? (
              <>
                <button
                  onClick={() => {
                    onResolve('CONFIRM_CHANGE', 'Confirmed dose/frequency modification as clinically indicated.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-colors text-center"
                >
                  Confirm Change
                </button>
                <button
                  onClick={() => {
                    onResolve('REVERT_PREVIOUS', 'Recommended maintaining previous outpatient dose.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors text-center"
                >
                  Review Previous Dose
                </button>
              </>
            ) : isDDI ? (
              <>
                <button
                  onClick={() => {
                    onResolve('SUBSTITUTE_ALTERNATIVE', `Substitute with safer alternative: ${discrepancy.ddiDetails?.safer_alternative || 'non-interacting agent'}.`);
                    onClose();
                  }}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-colors text-center"
                >
                  Switch Alternative
                </button>
                <button
                  onClick={() => {
                    onResolve('CONFIRM_CHANGE', 'Acknowledge DDI risk; monitor patient labs and symptoms closely.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-center"
                >
                  Acknowledge & Monitor
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onResolve('VERIFIED_CORRECT', 'Confirmed newly ordered medication with clinical team.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-colors text-center"
                >
                  Confirm Medication
                </button>
                <button
                  onClick={() => {
                    onResolve('MARK_FURTHER_REVIEW', 'Pended for attending physician rounds.');
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors text-center"
                >
                  Mark for Review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
