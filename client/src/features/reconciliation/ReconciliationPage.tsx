import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  AlertCircle,
  FileText,
  UserCheck,
  Send
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';
import { DiscrepancyItem, ResolutionAction, DiscrepancyType } from '../../types';

// Helper to dynamically generate clinical observation, explanation, and action when detected change is modified
const getExplanationForType = (
  type: DiscrepancyType,
  medName: string,
  prevDose: string = '',
  currDose: string = '',
  prevFreq: string = '',
  currFreq: string = ''
): {
  observation: string;
  clinicalExplanation: string;
  suggestedAction: string;
  defaultAction: ResolutionAction;
  severity: 'Critical' | 'Major' | 'Moderate' | 'Minor' | 'Info';
} => {
  switch (type) {
    case 'UNCHANGED':
      return {
        observation: `${medName} is concordant between previous outpatient records and the current inpatient prescription regimen (${currDose || prevDose || 'standard dose'} ${currFreq || prevFreq || 'daily'}).`,
        clinicalExplanation: `Medication therapy is verified uninterrupted with matching dosage, route, and frequency. No clinical transition gap or adjustment detected.`,
        suggestedAction: `Confirm continuation of established maintenance therapy without alteration.`,
        defaultAction: 'VERIFIED_CORRECT',
        severity: 'Info'
      };
    case 'DOSE_CHANGE':
      return {
        observation: `${medName} dosage modified from ${prevDose || 'baseline dose'} on outpatient record to ${currDose || 'adjusted dose'} on current inpatient order.`,
        clinicalExplanation: `Dose adjustment detected during care transition. Requires validation against current organ function (eGFR, hepatic panel), acute illness severity, and therapeutic drug monitoring goals.`,
        suggestedAction: `Verify whether dosage change was intentional based on acute clinical status or titration protocol.`,
        defaultAction: 'CONFIRM_CHANGE',
        severity: 'Major'
      };
    case 'FREQUENCY_CHANGE':
      return {
        observation: `${medName} administration frequency changed from ${prevFreq || 'previous frequency'} to ${currFreq || 'current frequency'}.`,
        clinicalExplanation: `Frequency alterations alter pharmacokinetics, steady-state plasma concentrations, and patient compliance risk. Confirm clinical necessity for changed timing.`,
        suggestedAction: `Confirm frequency adjustment aligns with inpatient protocol or chronotherapy guidelines.`,
        defaultAction: 'CONFIRM_CHANGE',
        severity: 'Moderate'
      };
    case 'DOSE_FREQUENCY_CHANGE':
      return {
        observation: `${medName} dose and frequency both adjusted from ${prevDose || 'prior dose'} (${prevFreq || 'prior freq'}) to ${currDose || 'current dose'} (${currFreq || 'current freq'}).`,
        clinicalExplanation: `Dual parameter change in dosage and frequency indicates significant therapeutic re-titration. Close clinical monitoring required.`,
        suggestedAction: `Verify intentionality and document clinical justification for simultaneous dose and schedule change.`,
        defaultAction: 'CONFIRM_CHANGE',
        severity: 'Major'
      };
    case 'ROUTE_CHANGE':
      return {
        observation: `${medName} administration route changed during admission/discharge care transition.`,
        clinicalExplanation: `Route transitions (e.g., IV to oral or transdermal) alter bioavailability and onset of action. Bioequivalence validation required.`,
        suggestedAction: `Confirm patient tolerates new administration route and bioavailability conversion is clinically equivalent.`,
        defaultAction: 'CONFIRM_CHANGE',
        severity: 'Moderate'
      };
    case 'POTENTIAL_OMISSION':
      return {
        observation: `${medName} (${prevDose || 'active dose'} ${prevFreq || ''}) documented on prior record but missing from current inpatient prescription.`,
        clinicalExplanation: `Unintentional omission of chronic maintenance therapy during hospital transitions is a leading source of adverse drug withdrawal events.`,
        suggestedAction: `Confirm omission or intentional hold to exclude from patient's finalized medication report.`,
        defaultAction: 'CONFIRM_DISCONTINUED',
        severity: 'Major'
      };
    case 'NEW_MEDICATION':
      return {
        observation: `${medName} (${currDose || 'prescribed dose'} ${currFreq || ''}) newly initiated on current order; absent from prior baseline record.`,
        clinicalExplanation: `New pharmacological therapy introduced during current clinical encounter. Baseline safety parameters and patient education required prior to discharge.`,
        suggestedAction: `Confirm therapeutic indication, allergy absence, and document new medication counseling plan.`,
        defaultAction: 'CONFIRM_CHANGE',
        severity: 'Info'
      };
    case 'POSSIBLE_DUPLICATE':
      return {
        observation: `Potential duplicate or therapeutic overlap identified for ${medName} within the same drug class.`,
        clinicalExplanation: `Redundant therapeutic agents in the same class increase cumulative toxicity without proportional clinical efficacy.`,
        suggestedAction: `Deprescribe redundant agent or select single preferred agent according to formulary guidelines.`,
        defaultAction: 'CONFIRM_DUPLICATE',
        severity: 'Major'
      };
    case 'DRUG_DRUG_INTERACTION':
      return {
        observation: `Significant pharmacodynamic or pharmacokinetic drug-drug interaction detected involving ${medName}.`,
        clinicalExplanation: `Concurrent co-administration carries heightened risk of toxicity, altered plasma levels, or diminished therapeutic efficacy.`,
        suggestedAction: `Review interaction severity, consider dose spacing, monitor laboratory markers, or switch to safer alternative.`,
        defaultAction: 'SUBSTITUTE_ALTERNATIVE',
        severity: 'Critical'
      };
    case 'ALLERGY_CONTRAINDICATION':
      return {
        observation: `${medName} flagged against patient's recorded hypersensitivity or clinical contraindications.`,
        clinicalExplanation: `Administration of an agent with recorded allergy or major disease-state contraindication presents immediate patient safety risk.`,
        suggestedAction: `Discontinue immediately and substitute with non-cross-reactive alternative.`,
        defaultAction: 'CONFIRM_DISCONTINUED',
        severity: 'Critical'
      };
    default:
      return {
        observation: `Clinical variation observed for ${medName}.`,
        clinicalExplanation: `Medication status requires clinical review during care transition.`,
        suggestedAction: `Review clinical indication and verify concordant therapy.`,
        defaultAction: 'CONFIRM_CHANGE',
        severity: 'Moderate'
      };
  }
};

export const ReconciliationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    patients, 
    resolveDiscrepancy, 
    finalizeReconciliation, 
    setIsAiDrawerOpen, 
    setActiveDiscrepancyForAi,
    currentUser,
    quickVerifyDiscrepancy,
    verifyAllRemaining
  } = useReconciliation();
  const navigate = useNavigate();

  const patient = patients.find(p => p.id === id) || patients[0];

  // Expanded cards tracker
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'disc-1': true,
    'disc-2': true,
    'disc-3': true,
  });

  // Inline resolution modal state
  const [activeResolvingDisc, setActiveResolvingDisc] = useState<DiscrepancyItem | null>(null);
  const [customRationale, setCustomRationale] = useState('');
  const [selectedAction, setSelectedAction] = useState<ResolutionAction>('CONFIRM_CHANGE');
  
  // Editable fields for medicine details & detected change
  const [selectedType, setSelectedType] = useState<DiscrepancyType>('UNCHANGED');
  const [currentDose, setCurrentDose] = useState('');
  const [currentFrequency, setCurrentFrequency] = useState('');
  const [currentRoute, setCurrentRoute] = useState('Oral');
  const [prevDose, setPrevDose] = useState('');
  const [prevFrequency, setPrevFrequency] = useState('');
  const [editedObservation, setEditedObservation] = useState('');
  const [editedClinicalExplanation, setEditedClinicalExplanation] = useState('');
  const [editedSuggestedAction, setEditedSuggestedAction] = useState('');

  // Finalization confirmation modal state
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [isFinalizedSuccess, setIsFinalizedSuccess] = useState(patient.reconciliationStatus === 'Completed');

  const toggleExpand = (discId: string) => {
    setExpandedCards(prev => ({ ...prev, [discId]: !prev[discId] }));
  };

  const handleOpenAiExplain = (disc: DiscrepancyItem) => {
    setActiveDiscrepancyForAi(disc);
    setIsAiDrawerOpen(true);
  };

  const openResolutionModal = (disc: DiscrepancyItem, defaultAction?: ResolutionAction) => {
    setActiveResolvingDisc(disc);
    setSelectedType(disc.type);

    const cDose = disc.currentRecord?.dose || disc.previousRecord?.dose || '';
    const cFreq = disc.currentRecord?.frequency || disc.previousRecord?.frequency || '';
    const cRoute = disc.currentRecord?.route || disc.previousRecord?.route || 'Oral';
    const pDose = disc.previousRecord?.dose || '';
    const pFreq = disc.previousRecord?.frequency || '';

    setCurrentDose(cDose);
    setCurrentFrequency(cFreq);
    setCurrentRoute(cRoute);
    setPrevDose(pDose);
    setPrevFrequency(pFreq);

    setEditedObservation(disc.aiObservation || '');
    setEditedClinicalExplanation(disc.clinicalExplanation || '');
    setEditedSuggestedAction(disc.suggestedAction || '');

    setSelectedAction(disc.resolution?.action || defaultAction || 'CONFIRM_CHANGE');
    setCustomRationale(disc.resolution?.rationale || '');
  };

  // When doctor changes the Detected Change dropdown, automatically recalculate & update the explanation fields
  const handleTypeChange = (newType: DiscrepancyType) => {
    setSelectedType(newType);
    if (activeResolvingDisc) {
      const generated = getExplanationForType(
        newType,
        activeResolvingDisc.medicationName,
        prevDose,
        currentDose,
        prevFrequency,
        currentFrequency
      );
      setEditedObservation(generated.observation);
      setEditedClinicalExplanation(generated.clinicalExplanation);
      setEditedSuggestedAction(generated.suggestedAction);
      setSelectedAction(generated.defaultAction);
    }
  };

  // Re-sync explanation based on edited dosage/frequency fields
  const handleResyncExplanation = () => {
    if (!activeResolvingDisc) return;
    const generated = getExplanationForType(
      selectedType,
      activeResolvingDisc.medicationName,
      prevDose,
      currentDose,
      prevFrequency,
      currentFrequency
    );
    setEditedObservation(generated.observation);
    setEditedClinicalExplanation(generated.clinicalExplanation);
    setEditedSuggestedAction(generated.suggestedAction);
  };

  const handleConfirmResolution = () => {
    if (!activeResolvingDisc) return;

    const explanationData = getExplanationForType(
      selectedType,
      activeResolvingDisc.medicationName,
      prevDose,
      currentDose,
      prevFrequency,
      currentFrequency
    );

    const updatedCurrentRecord = selectedType === 'POTENTIAL_OMISSION' && selectedAction === 'CONFIRM_DISCONTINUED'
      ? null
      : {
          dose: currentDose || activeResolvingDisc.currentRecord?.dose || 'Standard dose',
          frequency: currentFrequency || activeResolvingDisc.currentRecord?.frequency || 'Once daily',
          route: currentRoute || activeResolvingDisc.currentRecord?.route || 'Oral',
          orderDate: activeResolvingDisc.currentRecord?.orderDate || 'Today',
          prescriber: activeResolvingDisc.currentRecord?.prescriber || currentUser?.name || 'Attending Physician'
        };

    const updates: Partial<DiscrepancyItem> = {
      type: selectedType,
      severity: explanationData.severity,
      aiObservation: editedObservation || explanationData.observation,
      clinicalExplanation: editedClinicalExplanation || explanationData.clinicalExplanation,
      suggestedAction: editedSuggestedAction || explanationData.suggestedAction,
      currentRecord: updatedCurrentRecord
    };

    resolveDiscrepancy(
      patient.id,
      activeResolvingDisc.id,
      selectedAction,
      customRationale || 'Clinically verified against patient encounter treatment plan.',
      updates
    );
    setActiveResolvingDisc(null);
  };

  const handleExecuteFinalize = () => {
    finalizeReconciliation(patient.id);
    setFinalizeModalOpen(false);
    setIsFinalizedSuccess(true);
  };

  // Calculations
  const discrepancies = patient.discrepancies;
  const unreviewedCount = discrepancies.filter(d => d.status === 'REQUIRES_REVIEW').length;
  const reviewedCount = discrepancies.filter(d => d.status === 'REVIEWED').length;

  const countUnchanged = discrepancies.filter(d => d.type === 'UNCHANGED').length;
  const countNew = discrepancies.filter(d => d.type === 'NEW_MEDICATION').length;
  const countChanged = discrepancies.filter(d => d.type === 'DOSE_CHANGE' || d.type === 'FREQUENCY_CHANGE' || d.type === 'DOSE_FREQUENCY_CHANGE' || d.type === 'ROUTE_CHANGE').length;
  const countOmission = discrepancies.filter(d => d.type === 'POTENTIAL_OMISSION').length;
  const countDDI = discrepancies.filter(d => d.type === 'DRUG_DRUG_INTERACTION' || d.type === 'POSSIBLE_DUPLICATE' || d.type === 'ALLERGY_CONTRAINDICATION').length;

  const isReadyToFinalize = unreviewedCount === 0 || discrepancies.every(d => d.status === 'REVIEWED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Transitions of Care</span>
            <span>•</span>
            <span className="text-brand-600">Medication Reconciliation</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Reconciliation Workbench: {patient.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{patient.patientId}</span>
            <span>•</span>
            <span>{patient.encounter}</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">Attending: {patient.attendingPhysician}</span>
          </div>
        </div>

        {/* Status Badge & Finalize Action */}
        <div className="flex items-center space-x-3">
          {unreviewedCount > 0 ? (
            <div className="flex items-center space-x-2 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
              <AlertTriangle size={16} className="text-amber-600 animate-bounce" />
              <span>{unreviewedCount} Issues Require Review</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Ready to Finalize</span>
            </div>
          )}

          <button
            onClick={() => setFinalizeModalOpen(true)}
            disabled={patient.reconciliationStatus === 'Completed'}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-2 ${
              patient.reconciliationStatus === 'Completed'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isReadyToFinalize
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-navy-900 hover:bg-navy-800 text-white'
            }`}
          >
            <FileCheck size={16} />
            <span>{patient.reconciliationStatus === 'Completed' ? 'Reconciliation Finalized' : 'Finalize Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* Large Success Banner If Already Completed */}
      {isFinalizedSuccess && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-md shadow-emerald-500/20">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-emerald-900">Reconciliation Complete & Routed</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-300">
                  Patient Portal Live
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                All identified care-transition prescriptions have been harmonized, verified, and signed off. The official final report is now visible on <strong>{patient.name}'s Patient Dashboard</strong>.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-emerald-700 mt-2 font-medium">
                <span>Signed by: {patient.finalizedBy || currentUser?.name || 'Dr. Ananya Sharma'}</span>
                <span>•</span>
                <span>{patient.finalizedAt || 'September 25, 2026, 22:42'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/reports/${patient.id}`)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto flex items-center space-x-1.5"
          >
            <FileText size={15} />
            <span>View Full Clinical Report</span>
          </button>
        </div>
      )}

      {/* Reconciliation Summary Cards (Requirement #18) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Reconciliation Summary: {discrepancies.length} Medications Analyzed
          </h2>
          <span className="text-xs text-slate-400">
            {reviewedCount} of {discrepancies.length} items reviewed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          {/* Unchanged */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Unchanged</span>
            <span className="text-xl font-bold text-emerald-700">{countUnchanged}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Identical doses</span>
          </div>

          {/* Newly Added */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Newly Added</span>
            <span className="text-xl font-bold text-blue-700">{countNew}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">De novo orders</span>
          </div>

          {/* Changed */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Dose / Freq Change</span>
            <span className="text-xl font-bold text-amber-700">{countChanged}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Modified strength</span>
          </div>

          {/* Potential Omission */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Potential Omission</span>
            <span className="text-xl font-bold text-rose-700">{countOmission}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Missing from orders</span>
          </div>

          {/* DDI / Duplicates */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">DDI Conflicts</span>
            <span className="text-xl font-bold text-purple-700">{countDDI}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">80 DDI Rules checked</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Medication Comparison Table (Requirement #19) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Side-by-Side Medication Comparison</h2>
            <p className="text-xs text-slate-500">
              Cross-referencing Prior Outpatient Record vs. Current Inpatient Orders • <strong className="text-emerald-700">Only doctor-verified medicines are approved for final prescription</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreviewedCount > 0 && (
              <button
                onClick={() => verifyAllRemaining(patient.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Verify all remaining medications as safe"
              >
                <Check size={13} />
                <span>Verify All Safe ({unreviewedCount})</span>
              </button>
            )}
            <span className="text-xs font-mono bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-600">
              FHIR Concordance
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Previous Record</th>
                <th className="py-3 px-4">Current Record</th>
                <th className="py-3 px-4">Detected Change</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {discrepancies.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Medication Name */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{item.medicationName}</span>
                    {item.genericName && (
                      <span className="text-[10px] text-slate-400 italic block">{item.genericName}</span>
                    )}
                  </td>

                  {/* Previous Record */}
                  <td className="py-3.5 px-4">
                    {item.previousRecord ? (
                      <div>
                        <span className="font-semibold text-slate-800">{item.previousRecord.dose}</span>
                        <span className="text-slate-500 block text-[11px]">{item.previousRecord.frequency}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not Found</span>
                    )}
                  </td>

                  {/* Current Record */}
                  <td className="py-3.5 px-4">
                    {item.currentRecord ? (
                      <div>
                        <span className="font-semibold text-slate-800">{item.currentRecord.dose}</span>
                        <span className="text-slate-500 block text-[11px]">{item.currentRecord.frequency}</span>
                      </div>
                    ) : (
                      <span className="text-rose-600 font-semibold text-[11px]">Not Found (Omitted)</span>
                    )}
                  </td>

                  {/* Change Type Pill */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.type === 'POTENTIAL_OMISSION' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      item.type === 'NEW_MEDICATION' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      item.type === 'UNCHANGED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      item.type === 'DRUG_DRUG_INTERACTION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.type.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {item.status === 'REVIEWED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle size={12} />
                        Requires Review
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenAiExplain(item)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={12} className="text-brand-600" />
                        <span>Explain</span>
                      </button>

                      {item.status !== 'REVIEWED' && (
                        <button
                          onClick={() => quickVerifyDiscrepancy(patient.id, item.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Quickly verify medication safe for patient prescription"
                        >
                          <Check size={12} />
                          <span>Verify</span>
                        </button>
                      )}

                      <button
                        onClick={() => openResolutionModal(item, item.type === 'POTENTIAL_OMISSION' ? 'CONFIRM_DISCONTINUED' : 'CONFIRM_CHANGE')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          item.status === 'REVIEWED'
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                      >
                        {item.status === 'REVIEWED' ? 'Edit' : 'Review'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Cards Section (Requirement #20) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Clinical Discrepancy Cards</h2>
            <p className="text-xs text-slate-500">Explanations, pharmacological context, and clinical sign-off workflow</p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {unreviewedCount} pending resolution
          </span>
        </div>

        <div className="space-y-3">
          {discrepancies.map((disc) => {
            const isExpanded = expandedCards[disc.id];
            const isOmission = disc.type === 'POTENTIAL_OMISSION';
            const isDDI = disc.type === 'DRUG_DRUG_INTERACTION';
            const isNew = disc.type === 'NEW_MEDICATION';
            const isChange = disc.type === 'DOSE_CHANGE' || disc.type === 'DOSE_FREQUENCY_CHANGE' || disc.type === 'FREQUENCY_CHANGE';

            return (
              <div
                key={disc.id}
                className={`bg-white rounded-2xl border transition-all ${
                  disc.status === 'REVIEWED'
                    ? 'border-emerald-200/80 shadow-xs'
                    : isOmission
                    ? 'border-rose-300 shadow-sm'
                    : isDDI
                    ? 'border-purple-300 shadow-sm'
                    : isChange
                    ? 'border-amber-300 shadow-sm'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Card Header Banner */}
                <div
                  onClick={() => toggleExpand(disc.id)}
                  className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-start md:items-center space-x-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      disc.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-600' :
                      isOmission ? 'bg-rose-50 text-rose-600' :
                      isDDI ? 'bg-purple-50 text-purple-600' :
                      isChange ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {disc.status === 'REVIEWED' ? <CheckCircle2 size={18} /> :
                       isOmission ? <MinusCircle size={18} /> :
                       isDDI ? <AlertTriangle size={18} /> :
                       isChange ? <RefreshCw size={18} /> :
                       <PlusCircle size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isOmission ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          isDDI ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          isChange ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {disc.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{disc.medicationName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {disc.aiObservation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {disc.status === 'REVIEWED' ? (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Check size={13} />
                        Reviewed
                      </span>
                    ) : (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Review Needed
                      </span>
                    )}

                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 text-xs">
                    {/* Comparison Mini-Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-semibold text-slate-500 block mb-1 text-[11px]">Previous Outpatient Order</span>
                        {disc.previousRecord ? (
                          <div className="text-slate-800 space-y-0.5">
                            <p className="font-bold">{disc.previousRecord.dose}</p>
                            <p className="text-slate-600">{disc.previousRecord.frequency} ({disc.previousRecord.route || 'Oral'})</p>
                            <p className="text-[10px] text-slate-400 mt-1">{disc.previousRecord.sourceDate}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not found in prior record</span>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-semibold text-slate-500 block mb-1 text-[11px]">Current Inpatient Order</span>
                        {disc.currentRecord ? (
                          <div className="text-slate-800 space-y-0.5">
                            <p className="font-bold">{disc.currentRecord.dose}</p>
                            <p className="text-slate-600">{disc.currentRecord.frequency} ({disc.currentRecord.route || 'Oral'})</p>
                            <p className="text-[10px] text-slate-400 mt-1">{disc.currentRecord.prescriber || 'Admission Order'}</p>
                          </div>
                        ) : (
                          <span className="text-rose-600 font-bold">Omitted (Not ordered)</span>
                        )}
                      </div>
                    </div>

                    {/* AI Clinical Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-1 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-brand-600" />
                        AI Clinical Observation:
                      </strong>
                      <p>{disc.clinicalExplanation}</p>
                      <p className="mt-1.5 text-brand-900 font-medium bg-brand-50/80 p-2 rounded-lg border border-brand-200/80">
                        <strong>Suggested action:</strong> {disc.suggestedAction}
                      </p>
                    </div>

                    {/* Resolution Status or Action Buttons */}
                    {disc.status === 'REVIEWED' && disc.resolution ? (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-950">
                        <div>
                          <span className="font-bold flex items-center gap-1.5 flex-wrap">
                            <CheckCircle2 size={15} className="text-emerald-600" />
                            <span>Reviewed by {disc.resolution.reviewedBy}</span>
                            {disc.type === 'POTENTIAL_OMISSION' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/90 text-slate-700 border border-slate-300">
                                ✕ Removed from Patient Report
                              </span>
                            )}
                          </span>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            Action: <span className="font-semibold">{disc.resolution.action}</span> • "{disc.resolution.rationale}"
                          </p>
                          <span className="text-[10px] text-emerald-600 block mt-0.5">{disc.resolution.timestamp}</span>
                        </div>
                        <button
                          onClick={() => openResolutionModal(disc, disc.resolution!.action)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline self-start sm:self-auto"
                        >
                          Modify Resolution
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <button
                          onClick={() => handleOpenAiExplain(disc)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles size={14} className="text-brand-600" />
                          <span>AI Explain Assistant</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          {isOmission ? (
                            <>
                              <button
                                onClick={() => openResolutionModal(disc, 'CONFIRM_DISCONTINUED')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium rounded-lg border border-rose-200 transition-colors"
                              >
                                Confirm Omission (Remove from Report)
                              </button>
                              <button
                                onClick={() => openResolutionModal(disc, 'ADD_TO_CURRENT')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors"
                              >
                                Re-order to Current
                              </button>
                            </>
                          ) : isChange ? (
                            <>
                              <button
                                onClick={() => openResolutionModal(disc, 'REVERT_PREVIOUS')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors"
                              >
                                Maintain Outpatient Dose
                              </button>
                              <button
                                onClick={() => openResolutionModal(disc, 'CONFIRM_CHANGE')}
                                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-xs transition-colors"
                              >
                                Confirm Change
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openResolutionModal(disc, 'VERIFIED_CORRECT')}
                              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-xs transition-colors"
                            >
                              Confirm Order
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Doctor Clinical Validation & Reconciliation Modal */}
      {activeResolvingDisc && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Clinical Reconciliation & Validation
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Target: <strong className="text-slate-800">{activeResolvingDisc.medicationName}</strong></span>
                    {activeResolvingDisc.genericName && <span>({activeResolvingDisc.genericName})</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveResolvingDisc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Step 1: Medication Dosage & Schedule Record */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText size={14} className="text-brand-600" />
                    1. Edit Medication Details & Regimen
                  </span>
                  <span className="text-[10px] text-slate-400">Current Hospital / Inpatient Order</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Current Dose / Strength
                    </label>
                    <input
                      type="text"
                      value={currentDose}
                      onChange={(e) => setCurrentDose(e.target.value)}
                      placeholder="e.g. 50 mg, 10 mg"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Frequency & Timing
                    </label>
                    <input
                      type="text"
                      value={currentFrequency}
                      onChange={(e) => setCurrentFrequency(e.target.value)}
                      placeholder="e.g. Once daily, Twice daily"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Route
                    </label>
                    <input
                      type="text"
                      value={currentRoute}
                      onChange={(e) => setCurrentRoute(e.target.value)}
                      placeholder="e.g. Oral, IV, Subcutaneous"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Prior baseline reference */}
                <div className="pt-1 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Prior Outpatient Record:</span>
                    <span>{prevDose || 'None recorded'} {prevFrequency ? `(${prevFrequency})` : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResyncExplanation}
                    className="text-brand-600 hover:text-brand-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Update explanation based on modified dosage"
                  >
                    <RefreshCw size={11} />
                    <span>Sync Explanation with Fields</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Detected Change Classification (Editable Dropdown) */}
              <div className="p-3.5 rounded-xl bg-brand-50/40 border border-brand-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-brand-600" />
                    2. Detected Change Classification
                  </label>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedType === 'POTENTIAL_OMISSION' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    selectedType === 'NEW_MEDICATION' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedType === 'UNCHANGED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedType === 'DRUG_DRUG_INTERACTION' || selectedType === 'ALLERGY_CONTRAINDICATION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedType.replace(/_/g, ' ')}
                  </span>
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value as DiscrepancyType)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-brand-500 shadow-2xs"
                >
                  <option value="UNCHANGED">UNCHANGED - Unchanged / Concordant Baseline</option>
                  <option value="DOSE_CHANGE">DOSE_CHANGE - Dosage Modification (Strength Adjusted)</option>
                  <option value="FREQUENCY_CHANGE">FREQUENCY_CHANGE - Administration Frequency Changed</option>
                  <option value="DOSE_FREQUENCY_CHANGE">DOSE_FREQUENCY_CHANGE - Both Dose & Frequency Modified</option>
                  <option value="ROUTE_CHANGE">ROUTE_CHANGE - Administration Route / Formulation Altered</option>
                  <option value="POTENTIAL_OMISSION">POTENTIAL_OMISSION - Potential Omission / Missing from Regimen</option>
                  <option value="NEW_MEDICATION">NEW_MEDICATION - New Medication / De Novo Inpatient Order</option>
                  <option value="POSSIBLE_DUPLICATE">POSSIBLE_DUPLICATE - Duplicate Therapy / Same Class Overlap</option>
                  <option value="DRUG_DRUG_INTERACTION">DRUG_DRUG_INTERACTION - Pharmacological Interaction Alert</option>
                  <option value="ALLERGY_CONTRAINDICATION">ALLERGY_CONTRAINDICATION - Allergy Conflict / Contraindication</option>
                </select>

                <p className="text-[11px] text-brand-800 flex items-center gap-1.5 pt-0.5">
                  <Sparkles size={12} className="text-brand-600 flex-shrink-0" />
                  <span>Selecting a different detected change automatically updates the clinical observation, explanation, and recommended action below.</span>
                </p>
              </div>

              {/* Step 3: Clinical Explanation (Dynamically Updated & Editable) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-600" />
                    3. AI Clinical Explanation & Rationale (Dynamic)
                  </span>
                  <span className="text-[10px] text-slate-400">Editable by Doctor</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Observation (What Changed?)
                  </label>
                  <textarea
                    rows={2}
                    value={editedObservation}
                    onChange={(e) => setEditedObservation(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Clinical Rationale & Mechanism
                  </label>
                  <textarea
                    rows={2}
                    value={editedClinicalExplanation}
                    onChange={(e) => setEditedClinicalExplanation(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Recommended Clinical Action
                  </label>
                  <input
                    type="text"
                    value={editedSuggestedAction}
                    onChange={(e) => setEditedSuggestedAction(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Step 4: Clinical Resolution & Doctor Sign-Off */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-brand-600" />
                  4. Doctor Clinical Action & Audit Rationale
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Clinical Action Decision
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as ResolutionAction)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500"
                  >
                    <option value="CONFIRM_CHANGE">Confirm Change (Clinically Indicated)</option>
                    <option value="REVERT_PREVIOUS">Revert / Request Previous Dose</option>
                    <option value="ADD_TO_CURRENT">Add Omitted Drug to Current List</option>
                    <option value="CONFIRM_DISCONTINUED">Confirm Intentionally Discontinued</option>
                    <option value="SUBSTITUTE_ALTERNATIVE">Substitute with Safer Alternative (DDI)</option>
                    <option value="MARK_FURTHER_REVIEW">Mark for Attending Physician Rounding</option>
                    <option value="VERIFIED_CORRECT">Verify Concordant / Accepted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Doctor's Justification & Audit Note
                  </label>
                  <textarea
                    rows={2}
                    value={customRationale}
                    onChange={(e) => setCustomRationale(e.target.value)}
                    placeholder="Enter clinical justification (e.g. 'Dose verified concordant with inpatient renal panel and discharge plan')..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
                  <UserCheck size={14} className="text-brand-600 flex-shrink-0" />
                  <span>Will record in immutable audit log under <strong>{currentUser?.name || patient.attendingPhysician || 'Attending Physician'}</strong>.</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveResolvingDisc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>Save Changes & Verify</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalization Confirmation Modal (Requirement #25) */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileCheck size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Finalize Medication Reconciliation?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to sign off on the reconciled medication list for <strong>{patient.name}</strong> ({patient.patientId}).
                This will lock the care-transition record and automatically route the official finalized medication report to <strong>{patient.name}'s Patient Dashboard</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Total Medications Evaluated:</span>
                <span className="font-bold text-slate-900">{discrepancies.length}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Approved Active Regimen for Patient:
                </span>
                <span>{discrepancies.filter(d => d.status === 'REVIEWED' && d.type !== 'POTENTIAL_OMISSION').length} items</span>
              </div>
              {discrepancies.some(d => d.status === 'REVIEWED' && d.type === 'POTENTIAL_OMISSION') && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <MinusCircle size={13} className="text-slate-400" />
                    Verified Omission (Removed from Report):
                  </span>
                  <span>{discrepancies.filter(d => d.status === 'REVIEWED' && d.type === 'POTENTIAL_OMISSION').length} items</span>
                </div>
              )}
              {unreviewedCount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={13} />
                    Unverified (Withheld from Patient):
                  </span>
                  <span>{unreviewedCount} items</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Attending Signer:</span>
                <span className="font-semibold text-slate-800">{currentUser?.name || patient.attendingPhysician}</span>
              </div>
            </div>

            {/* Safety Protocol Banner */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              unreviewedCount > 0 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              {unreviewedCount > 0 ? (
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Clinical Safety Protocol:</strong> Only the <strong>{reviewedCount} doctor-verified medication(s)</strong> will be approved for {patient.name}'s final prescription report. The {unreviewedCount} unverified item(s) will be withheld from active patient continuation.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>All {reviewedCount} medications verified:</strong> 100% of analyzed medications have been validated and signed off by {currentUser?.name || patient.attendingPhysician}.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteFinalize}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>{unreviewedCount > 0 ? `Finalize & Approve (${reviewedCount} Verified)` : 'Finalize & Sign Off'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
