import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Building2, 
  Stethoscope, 
  AlertTriangle, 
  FileCheck2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldAlert, 
  X,
  ExternalLink,
  Pill,
  Activity,
  Check
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';
import { MedicationSource } from '../../types';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, runReconciliation, setSelectedPatientId } = useReconciliation();
  const navigate = useNavigate();

  const patient = patients.find(p => p.id === id) || patients[0];

  // Ingestion Source Inspection Modal
  const [selectedSourceForModal, setSelectedSourceForModal] = useState<MedicationSource | null>(null);

  // Run AI Reconciliation Animation Sequence State (Requirement #16)
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileStep, setReconcileStep] = useState(0);

  const steps = [
    'Analyzing medication sources across care transitions...',
    'Extracting & OCR normalizing medication names...',
    'Comparing dosage, route, and daily administration frequency...',
    'Checking for potential unintended omissions...',
    'Cross-referencing 80 trained DrugBank DDI rules & allergy conflicts...',
    'Generating structured clinical review alerts...'
  ];

  const handleRunReconciliation = () => {
    setIsReconciling(true);
    setReconcileStep(0);

    const stepInterval = setInterval(() => {
      setReconcileStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(async () => {
            await runReconciliation(patient.id);
            setIsReconciling(false);
            setSelectedPatientId(patient.id);
            navigate(`/reconciliation/${patient.id}`);
          }, 600);
          return prev;
        }
      });
    }, 280); // Quick 1.6-second total sequence
  };

  const unreviewedDiscrepancies = patient.discrepancies.filter(d => d.status === 'REQUIRES_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Patient Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xl shadow-md shadow-brand-500/10 flex-shrink-0">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md">
                {patient.patientId}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                patient.reconciliationStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                patient.reconciliationStatus === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {patient.reconciliationStatus}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span>{patient.age} yrs • {patient.gender}</span>
              <span>•</span>
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                {patient.encounter} ({patient.room || 'Bed 12'})
              </span>
              <span>•</span>
              <span>Admitted: {patient.admissionDate}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button: Run AI Reconciliation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all group"
          >
            <Sparkles size={16} className={isReconciling ? 'animate-spin' : ''} />
            <span>{isReconciling ? 'Reconciling Records...' : 'Run AI Reconciliation'}</span>
            {!isReconciling && <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </div>
      </div>

      {/* AI Processing Sequence Modal (Requirement #16) */}
      {isReconciling && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                <Sparkles size={20} className="animate-spin text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ReconRx Safety Copilot</h3>
                <p className="text-xs text-slate-500">Autonomous Discrepancy & DDI Analysis</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {steps.map((stepText, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-2.5 text-xs transition-opacity duration-200 ${
                    idx < reconcileStep ? 'text-emerald-700 font-medium' :
                    idx === reconcileStep ? 'text-brand-700 font-bold' :
                    'text-slate-300'
                  }`}
                >
                  {idx < reconcileStep ? (
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                  ) : idx === reconcileStep ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-200 flex-shrink-0" />
                  )}
                  <span>{stepText}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Patient: {patient.name}</span>
              <span>Trained DDI Rules Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Patient Clinical Context & Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attending Physician */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <Stethoscope size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Attending Physician</span>
            <span className="text-xs font-bold text-slate-800">{patient.attendingPhysician}</span>
          </div>
        </div>

        {/* Known Allergies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Documented Allergies</span>
            <span className="text-xs font-bold text-rose-700">{patient.allergies.join(', ') || 'No known allergies'}</span>
          </div>
        </div>

        {/* Vitals & Na/K Ratio (From Cohort training) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
            <Activity size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Vitals & Electrolytes</span>
            <span className="text-xs font-bold text-slate-800">
              BP: {patient.vitalSigns?.bp || '130/80'} • Na/K: {patient.vitalSigns?.naToKRatio || '14.2'}
            </span>
          </div>
        </div>
      </div>

      {/* Medication Sources Section (Requirement #15) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Medication Sources</h2>
            <p className="text-xs text-slate-500">Historical prescriptions and clinical records ingested for reconciliation</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">3 verified clinical sources</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patient.sources.map((source) => (
            <div
              key={source.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-700">
                    {source.type}
                  </span>
                  <span className="flex items-center text-emerald-600 font-medium text-[11px]">
                    <CheckCircle2 size={13} className="mr-1" /> Processed
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{source.facility || 'Clinical Provider'}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} /> {source.date}
                </p>

                <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Medications in file:</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-900 font-bold">
                      {source.medications.length}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                    {source.medications.slice(0, 3).map((m, idx) => (
                      <li key={idx} className="truncate">• {m.name} {m.dose} ({m.frequency})</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* View Source Button */}
              <button
                onClick={() => setSelectedSourceForModal(source)}
                className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5"
              >
                <FileText size={14} />
                <span>View Source Details</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Discrepancies Alert Banner (If Any Unresolved) */}
      {unreviewedDiscrepancies > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {unreviewedDiscrepancies} Care Transition Discrepancies Require Review
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Potential omissions and dose/frequency shifts identified between outpatient records and admission orders.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedPatientId(patient.id);
              navigate(`/reconciliation/${patient.id}`);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Review Discrepancies
          </button>
        </div>
      )}

      {/* Source Inspection Modal */}
      {selectedSourceForModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedSourceForModal.type}</h3>
                <p className="text-xs text-slate-500">{selectedSourceForModal.facility} • {selectedSourceForModal.date}</p>
              </div>
              <button
                onClick={() => setSelectedSourceForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="p-2.5 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 text-[11px]">
                <strong>Ingestion Status:</strong> Cleanly parsed and normalized against standard formularies.
              </div>

              <div className="divide-y divide-slate-100">
                {selectedSourceForModal.medications.map((med) => (
                  <div key={med.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{med.name}</span>
                      <span className="text-slate-500 text-[11px]">{med.dose} • {med.frequency} • {med.route}</span>
                      {med.indication && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">Indication: {med.indication}</span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedSourceForModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
