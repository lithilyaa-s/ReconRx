import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pill, 
  Clock, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  ArrowLeft, 
  Building2, 
  Activity, 
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

export const MedicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedPatient } = useReconciliation();
  const navigate = useNavigate();

  // Find medication across sources
  const allMeds = selectedPatient?.sources.flatMap(s => s.medications) || [];
  const med = allMeds.find(m => m.id === id || m.name.toLowerCase() === id?.toLowerCase()) || allMeds[0];

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medication Profile</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {med?.name || 'Metformin'}
          </h1>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Generic Name</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med?.genericName || med?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Standard Strength / Dose</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med?.dose}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Frequency</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med?.frequency}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Route</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med?.route}</span>
          </div>
        </div>

        {/* Source & Tracking Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building2 size={16} className="text-brand-600" />
              Source & Recording Metadata
            </h3>
            <div className="divide-y divide-slate-100 text-slate-600">
              <div className="py-1.5 flex justify-between">
                <span>Ingestion Source:</span>
                <span className="font-semibold text-slate-800">{med?.source}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>First Recorded:</span>
                <span>{med?.prescribedDate || 'September 22, 2026'}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>Prescribing Clinician:</span>
                <span>{med?.prescribingDoctor || 'Dr. K. V. Iyer'}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>Current Status:</span>
                <span className="text-emerald-700 font-bold">Active Inpatient Order</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Clock size={16} className="text-brand-600" />
              History of Care Transition Changes
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Transition history across admission order entry: Metformin was titrated from 500 mg BID to 1000 mg QD on September 25, 2026.
            </p>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
              <strong>Clinical Guardrail:</strong> ReconRx documents historical changes for safety validation and does not provide prescribing or diagnostic suggestions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
