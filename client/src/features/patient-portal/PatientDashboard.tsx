import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Pill, 
  Download, 
  Printer, 
  LogOut, 
  Sparkles,
  Stethoscope,
  Heart,
  ChevronRight,
  ShieldAlert,
  Pencil,
  Trash2,
  FileCheck,
  ExternalLink,
  X,
  Check
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';
import { SubmitPrescriptionModal } from './SubmitPrescriptionModal';
import { MedicationSource, FinalReconciledReport } from '../../types';

export const PatientDashboard: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    patients, 
    selectedPatient, 
    addPatientSubmittedSource,
    updatePatientSubmittedSource,
    deletePatientSubmittedSource
  } = useReconciliation();
  const navigate = useNavigate();

  // Find active patient record for the logged-in patient
  const patient = patients.find(p => p.id === currentUser?.patientId) || selectedPatient || patients[0];

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<MedicationSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<MedicationSource | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [regimenFilter, setRegimenFilter] = useState<'active' | 'all' | 'discontinued'>('active');

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('reconrx_user');
    navigate('/patient/login');
  };

  const isFinalized = patient.reconciliationStatus === 'Completed' || !!patient.finalReport;

  // Set of medication names that were detected as POTENTIAL_OMISSION
  const omissionMedNames = new Set(
    patient.discrepancies
      .filter(d => d.type === 'POTENTIAL_OMISSION')
      .map(d => d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim().toLowerCase())
  );

  // Compile list of ONLY doctor-verified and approved medications from patient.finalReport or fallback to verified discrepancies
  // USER SAFETY RULE: For whatever medicine it has been detected as POTENTIAL OMISSION,
  // after verification by the doctor, it should get removed from the report of the patient!
  const rawReconciledMeds = patient.finalReport?.reconciledMedications || (() => {
    const list: Array<{
      name: string;
      dose: string;
      frequency: string;
      route: string;
      action: string;
      rationale: string;
      status: 'Active' | 'Discontinued' | 'Modified' | 'Held';
      originFacility?: string;
      verifiedByDoctor?: boolean;
    }> = [];
    const seen = new Set<string>();

    for (const d of patient.discrepancies) {
      // CRITICAL PATIENT SAFETY: Only include medications verified and validated by the doctor!
      if (d.status !== 'REVIEWED') continue;
      // Remove any medicine detected as POTENTIAL_OMISSION
      if (d.type === 'POTENTIAL_OMISSION') continue;

      const clean = d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        const isDiscontinued = d.resolution?.action === 'CONFIRM_DISCONTINUED' || d.resolution?.action === 'CONFIRM_DUPLICATE';
        const isHold = d.resolution?.action === 'MARK_FURTHER_REVIEW';
        const isModified = d.resolution?.action === 'REVERT_PREVIOUS' || d.resolution?.action === 'SUBSTITUTE_ALTERNATIVE' || d.type.includes('CHANGE');
        list.push({
          name: clean,
          dose: d.currentRecord?.dose || d.previousRecord?.dose || 'Standard dose',
          frequency: d.currentRecord?.frequency || d.previousRecord?.frequency || 'Once daily',
          route: d.currentRecord?.route || d.previousRecord?.route || 'Oral',
          action: d.resolution?.action ? d.resolution.action.replace(/_/g, ' ') : 'Verified Safe by Doctor',
          rationale: d.resolution?.rationale || 'Clinically validated and verified safe by attending physician.',
          status: isDiscontinued ? 'Discontinued' : isHold ? 'Held' : isModified ? 'Modified' : 'Active',
          originFacility: d.previousRecord?.sourceName || patient.sources[0]?.facility || 'Clinical Record',
          verifiedByDoctor: true
        });
      }
    }

    return list;
  })();

  // Filter out any potential omission from the reconciled medications
  const reconciledMeds = rawReconciledMeds.filter(m => !omissionMedNames.has(m.name.toLowerCase()));

  // Track any unverified medications from prior records that were withheld from active patient therapy
  const unverifiedMeds = (patient.finalReport?.unverifiedMedications || patient.discrepancies
    .filter(d => d.status !== 'REVIEWED' && d.type !== 'POTENTIAL_OMISSION')
    .map(d => ({
      name: d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim(),
      dose: d.currentRecord?.dose || d.previousRecord?.dose || 'Standard dose',
      frequency: d.currentRecord?.frequency || d.previousRecord?.frequency || 'Unscheduled',
      reason: 'Withheld — Pending physician safety validation.'
    }))).filter(m => !omissionMedNames.has(m.name.toLowerCase()));

  const activeMeds = reconciledMeds.filter(m => m.status === 'Active' || m.status === 'Modified');
  const discontinuedMeds = reconciledMeds.filter(m => m.status === 'Discontinued' || m.status === 'Held');

  const filteredMeds = regimenFilter === 'active' 
    ? activeMeds 
    : regimenFilter === 'discontinued' 
    ? discontinuedMeds 
    : reconciledMeds;

  const handleDownloadReport = () => {
    const reportDate = patient.finalReport?.generatedAt || patient.finalizedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const doctor = patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician || 'Attending Physician';
    
    const lines = [
      '=========================================================================',
      'RECONRX — OFFICIAL RECONCILED MEDICATION REPORT & CARE-TRANSITION SUMMARY',
      'Joint Commission NPSG 03.06.01 Medication Safety Standard Certified',
      '=========================================================================',
      '',
      `Patient Name:        ${patient.name}`,
      `Patient ID (MRN):    ${patient.patientId}`,
      `Age / Gender:        ${patient.age} / ${patient.gender}`,
      `Encounter:           ${patient.encounter}`,
      `Known Allergies:     ${patient.allergies.join(', ') || 'None documented'}`,
      `Reconciled By:       ${doctor}`,
      `Finalized Date:      ${reportDate}`,
      `Status:              OFFICIALLY RECONCILED & FINALIZED`,
      `Safety Rule:         ONLY DOCTOR-VERIFIED MEDICATIONS APPROVED FOR ACTIVE USE`,
      '',
      '-------------------------------------------------------------------------',
      'SUBMITTED HOSPITAL PRESCRIPTIONS HARMONIZED',
      '-------------------------------------------------------------------------',
      ...(patient.sources.map((s, idx) => `[${idx + 1}] ${s.facility || 'Hospital'} (${s.date}) — ${s.medications.length} medication(s) reported`)),
      '',
      '-------------------------------------------------------------------------',
      'APPROVED ACTIVE MEDICATION SCHEDULE (TAKE AS DIRECTED)',
      '-------------------------------------------------------------------------',
      ...(activeMeds.length > 0 
        ? activeMeds.map((m, idx) => 
            `${idx + 1}. ${m.name.toUpperCase()} — ${m.dose}\n   Frequency:     ${m.frequency}\n   Route:         ${m.route}\n   Verification:  Doctor Verified & Approved\n   Origin:        ${m.originFacility || 'Hospital Record'}\n   Doctor Note:   "${m.rationale}"\n`
          )
        : ['No active daily medications approved.']),
      '',
      '-------------------------------------------------------------------------',
      'DISCONTINUED / HELD MEDICATIONS (DO NOT TAKE)',
      '-------------------------------------------------------------------------',
      ...(discontinuedMeds.length > 0 
        ? discontinuedMeds.map((m, idx) => 
            `[STOP] ${m.name} (${m.dose}) — Reason: ${m.rationale}`
          )
        : ['None discontinued.']),
      '',
      '-------------------------------------------------------------------------',
      'WITHHELD / UNVERIFIED MEDICATIONS (NOT APPROVED FOR PATIENT USE)',
      '-------------------------------------------------------------------------',
      ...(unverifiedMeds.length > 0
        ? unverifiedMeds.map((m, idx) =>
            `[WITHHELD] ${m.name} (${m.dose}) — Status: Not approved by physician for safety`
          )
        : ['All evaluated medications were verified by attending physician. None withheld.']),
      '',
      '-------------------------------------------------------------------------',
      'PATIENT SAFETY ADVISORY',
      '-------------------------------------------------------------------------',
      '• Take medications strictly as scheduled in the active table above.',
      '• Never combine medications from prior discharge slips that are marked as discontinued or withheld.',
      '• In case of dizziness, chest discomfort, or adverse reactions, contact hospital triage.',
      '',
      '-------------------------------------------------------------------------',
      'DIGITAL SIGN-OFF',
      '-------------------------------------------------------------------------',
      `Electronically Verified & Signed by: ${doctor}`,
      `Timestamp: ${reportDate}`,
      'ReconRx Clinical Medication Reconciliation Engine v2.4'
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReconRx_Final_Reconciled_Report_${patient.patientId}_${patient.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Patient Portal Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <span className="text-lg tracking-tight">Rx</span>
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                ReconRx
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200 rounded-md">
                  Patient Portal
                </span>
              </span>
              <p className="text-[11px] text-slate-400">Personal Health & Medication Transitions</p>
            </div>
          </div>

          {/* Right Action: Patient Profile & Sign Out */}
          <div className="flex items-center space-x-3">
            {/* Patient Badge */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-xs border border-brand-200">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{patient.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{patient.patientId}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Welcome & Reconciliation Status Banner */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-medium">
              <ShieldCheck size={14} className="text-brand-600" />
              <span>Care Transition Safety Protected</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {patient.name}
            </h1>

            <p className="text-xs md:text-sm text-slate-500 max-w-xl leading-relaxed">
              Submit your medical prescriptions and hospital discharge summaries here. Our hospital clinical pharmacy team reconciles every medication to ensure you avoid harmful drug interactions and dosing errors.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
              <span>Patient ID: <strong className="font-mono text-slate-800">{patient.patientId}</strong></span>
              <span>•</span>
              <span>Attending: <strong className="text-slate-800">{patient.attendingPhysician}</strong></span>
              <span>•</span>
              <span>Encounter: <strong className="text-slate-800">{patient.encounter}</strong></span>
            </div>
          </div>

          {/* Primary Action: Submit New Prescription */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-sm shadow-brand-600/20 text-xs md:text-sm flex items-center justify-center space-x-2 transition-all group"
            >
              <Upload size={17} />
              <span>Submit Hospital Prescription</span>
              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Status Callout Card */}
        {isFinalized ? (
          <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
            <div className="flex items-start space-x-4">
              <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-md shadow-emerald-600/25">
                ✓
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base md:text-lg font-bold text-emerald-950">
                    Official Reconciled Medication Report Ready
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                    Doctor Signed & Certified
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">
                  {patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician || 'Your attending doctor'} has cross-referenced and reconciled all your submitted prescriptions across {patient.sources.length} healthcare setting(s) into this certified care-transition regimen.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-emerald-700 font-medium">
                  <span>Sign-off: <strong>{patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician}</strong></span>
                  <span>•</span>
                  <span>Certified Date: <strong>{patient.finalReport?.generatedAt || patient.finalizedAt || 'September 25, 2026, 22:42'}</strong></span>
                  <span>•</span>
                  <span className="font-mono">NPSG 03.06.01 Compliant</span>
                </div>
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-center">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileText size={15} />
                <span>View Full Clinical Report</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="px-3.5 py-2.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Download Summary Report"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                <Clock size={24} className="animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-900">Clinical Reconciliation Underway</h3>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-md uppercase">
                    Review Pending
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                  Your submitted prescriptions and hospital orders are being reconciled by <strong>{patient.attendingPhysician || 'your attending physician'}</strong>. Once the doctor completes reconciliation and signs off, your official finalized report will automatically route here.
                </p>
                <span className="text-[11px] text-amber-700 mt-1.5 block">
                  Prescriptions under review: <strong>{patient.sources.length} hospital record(s)</strong> • Doctor: <strong>{patient.attendingPhysician || 'Dr. Ananya Sharma, MD'}</strong>
                </span>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl self-start sm:self-auto border border-amber-300">
              Awaiting Doctor Sign-Off
            </span>
          </div>
        )}

        {/* Section 1: Finalized Medication Plan (If Doctor has Finalized) */}
        {isFinalized && (
          <div id="verified-plan" className="bg-white rounded-3xl border border-emerald-200 shadow-card p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
            {/* Header and Print Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Official Reconciled Daily Medication Regimen
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold">
                    Active Care Plan
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Take medications strictly as instructed in this harmonized schedule. Verified across all care settings.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <FileText size={14} />
                  <span>Clinical Report View</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} />
                  <span>Print Wallet Card</span>
                </button>
              </div>
            </div>

            {/* Reconciled Prescriptions Harmonized Pill Strip */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 size={14} className="text-brand-600" />
                <span>Hospital Records Reconciled into this Report:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {patient.sources.map((s, idx) => (
                  <span
                    key={s.id || idx}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 font-medium flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <strong>{s.facility || 'Hospital'}</strong>
                    <span className="text-slate-400">({s.medications.length} meds)</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Doctor Safety Validation Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-start sm:items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="block text-emerald-950">Doctor Safety Validation Certified</strong>
                  <span className="text-emerald-800 text-[11px]">
                    Validated & signed off by <strong>{patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician}</strong>. Only doctor-verified medications are approved for active therapy.
                  </span>
                </div>
              </div>
              <span className="font-semibold text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-300 self-start sm:self-auto text-xs whitespace-nowrap shadow-2xs">
                ✓ {activeMeds.length} Approved Active
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setRegimenFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  regimenFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Active Daily Regimen</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${regimenFilter === 'active' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {activeMeds.length}
                </span>
              </button>

              <button
                onClick={() => setRegimenFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  regimenFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Reconciled Items</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${regimenFilter === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {reconciledMeds.length}
                </span>
              </button>

              {discontinuedMeds.length > 0 && (
                <button
                  onClick={() => setRegimenFilter('discontinued')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    regimenFilter === 'discontinued'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Discontinued / Do Not Take</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${regimenFilter === 'discontinued' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'}`}>
                    {discontinuedMeds.length}
                  </span>
                </button>
              )}
            </div>

            {/* Reconciled Medication Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeds.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    m.status === 'Discontinued' || m.status === 'Held'
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{m.name}</span>
                      <span className="text-[10px] text-slate-400">
                        Origin: {m.originFacility || 'Hospital Record'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Doctor Verified
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        m.status === 'Discontinued' || m.status === 'Held'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : m.status === 'Modified'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {m.status === 'Discontinued' ? '✕ Stop Taking' : m.status === 'Held' ? 'Hold' : '✓ Active'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Dose</span>
                      <span className="font-bold text-slate-800">{m.dose}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Frequency</span>
                      <span className="font-medium text-slate-700">{m.frequency}</span>
                    </div>
                  </div>

                  {m.rationale && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                      <strong className="text-slate-800 block">Doctor's Clinical Note:</strong>
                      <p className="italic">"{m.rationale}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Unverified / Withheld Medications (Do Not Take) Warning */}
            {unverifiedMeds.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Withheld Medications ({unverifiedMeds.length}) — Not Approved by Doctor
                  </h4>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  The following items from submitted or previous records were <strong>not approved or verified for safety by Dr. {patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician}</strong> and are withheld from your prescription. Do not take these medications:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {unverifiedMeds.map((uv, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>{uv.name} {uv.dose ? `(${uv.dose})` : ''}</span>
                      <span className="text-[10px] text-amber-600 font-normal italic">— Withheld</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Safety Box & Clinical Instructions */}
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex items-start space-x-3 text-xs text-brand-950">
              <Heart size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold text-brand-950">Important Clinical Advice from Your Attending Physician</strong>
                <p className="leading-relaxed text-brand-900">
                  {patient.finalReport?.doctorInstructions || 
                   `Take active medications strictly as scheduled. Do not resume or combine any medications marked as discontinued from previous hospital visits. If you experience unexpected symptoms or side effects, consult hospital pharmacy triage immediately.`}
                </p>
                <span className="text-[11px] text-brand-700 block font-medium">
                  Verified by {patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician} • Attending Clinical Team
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Submitted Hospital Records & Prescriptions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Your Submitted Prescriptions & Records</h2>
              <p className="text-xs text-slate-500">Records from external hospitals, clinics, and pharmacies ingested into ReconRx</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-medium">{patient.sources.length} record(s) on file</span>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Upload size={13} />
                <span>+ New Prescription</span>
              </button>
            </div>
          </div>

          {patient.sources.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                <FileText size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Prescriptions On File</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                You currently have no recorded prescriptions. Click below to submit a hospital prescription or medical record for clinical reconciliation.
              </p>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload size={14} />
                <span>Submit Hospital Prescription</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patient.sources.map((source) => (
                <div
                  key={source.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Type Badge, Status, and Edit / Delete actions */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-700">
                          {source.type}
                        </span>
                        {source.status === 'Needs Ingestion' ? (
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                            Review Pending
                          </span>
                        ) : (
                          <span className="flex items-center text-emerald-600 font-medium text-[11px]">
                            <CheckCircle2 size={13} className="mr-1" /> Verified
                          </span>
                        )}
                      </div>

                      {/* Card Quick Action Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingSource(source)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                          title="Edit Prescription"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingSource(source)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Delete Prescription"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{source.facility || 'Healthcare Clinic'}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {source.date}
                      </span>
                      {source.medications[0]?.prescribingDoctor && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 truncate max-w-[160px]" title={source.medications[0].prescribingDoctor}>
                            <Stethoscope size={12} /> {source.medications[0].prescribingDoctor}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Prescribed Medications Box */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          Medications Prescribed ({source.medications.length}):
                        </span>
                        {source.medications.length > 3 && (
                          <button
                            onClick={() => setExpandedSourceId(expandedSourceId === source.id ? null : source.id)}
                            className="text-[10px] text-brand-600 font-semibold hover:underline"
                          >
                            {expandedSourceId === source.id ? 'Show less' : `+${source.medications.length - 3} more`}
                          </button>
                        )}
                      </div>

                      {source.medications.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No medications recorded.</p>
                      ) : (
                        <ul className="space-y-1.5 text-[11px] text-slate-600">
                          {(expandedSourceId === source.id ? source.medications : source.medications.slice(0, 3)).map((m, idx) => (
                            <li key={idx} className="flex items-start justify-between gap-2 border-b border-slate-100/60 pb-1 last:border-0 last:pb-0">
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block truncate">{m.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{m.frequency}</span>
                              </div>
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700 font-mono flex-shrink-0">
                                {m.dose}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: File & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="truncate max-w-[130px]" title={source.documentName || 'Prescription.pdf'}>
                      Doc: {source.documentName || 'Prescription.pdf'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingSource(source)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                      >
                        Edit
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => setDeletingSource(source)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Submit New Prescription Modal */}
      <SubmitPrescriptionModal
        isOpen={isSubmitModalOpen}
        mode="create"
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={(newSource) => addPatientSubmittedSource(patient.id, newSource)}
        patientName={patient.name}
      />

      {/* Edit Recorded Prescription Modal */}
      {editingSource && (
        <SubmitPrescriptionModal
          isOpen={true}
          mode="edit"
          initialSource={editingSource}
          onClose={() => setEditingSource(null)}
          onSubmit={(updatedSource) => {
            updatePatientSubmittedSource(patient.id, updatedSource);
            setEditingSource(null);
          }}
          patientName={patient.name}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSource && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Prescription Record?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to remove the prescription from <strong className="text-slate-800">{deletingSource.facility || 'Hospital'}</strong>? 
                  This will remove all <strong className="text-slate-800">{deletingSource.medications.length}</strong> reported medication(s) from your reconciliation records.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Hospital / Facility:</span>
                <span className="font-semibold text-slate-900">{deletingSource.facility || 'Healthcare Clinic'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <span className="font-medium text-slate-800">{deletingSource.date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Medications:</span>
                <span className="font-medium text-slate-800">{deletingSource.medications.length} item(s)</span>
              </div>
              {deletingSource.documentName && (
                <div className="flex justify-between text-slate-600">
                  <span>File:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{deletingSource.documentName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSource(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePatientSubmittedSource(patient.id, deletingSource.id);
                  setDeletingSource(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Clinical Report Document Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header Bar */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Official Medication Reconciliation Clinical Summary
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      Verified & Certified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Joint Commission NPSG 03.06.01 Medication Safety Standard Compliant
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Body (Printable & Scrollable) */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto text-xs text-slate-700 font-sans">
              {/* Patient Banner */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                  <span className="text-sm font-bold text-slate-900">{patient.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">MRN / Patient ID</span>
                  <span className="text-sm font-mono font-semibold text-slate-900">{patient.patientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Age / Gender</span>
                  <span className="text-sm font-semibold text-slate-900">{patient.age} Yrs / {patient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Known Allergies</span>
                  <span className="text-sm font-semibold text-rose-600">{patient.allergies.join(', ') || 'No known drug allergies'}</span>
                </div>
              </div>

              {/* Ingested Prescriptions Cross-Referenced */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-brand-600" />
                  <span>Cross-Referenced Hospital Prescriptions ({patient.sources.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {patient.sources.map((s, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate">{s.facility || 'Healthcare Clinic'}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">✓ Ingested</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Date: {s.date}</p>
                      <p className="text-[11px] text-slate-400">{s.medications.length} medication(s) reported</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Reconciled Regimen Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck size={14} className="text-emerald-600" />
                  <span>Official Reconciled Daily Regimen (Active Schedule)</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                        <th className="p-3">Medication</th>
                        <th className="p-3">Dose & Route</th>
                        <th className="p-3">Directions / Frequency</th>
                        <th className="p-3">Source Hospital</th>
                        <th className="p-3">Doctor's Clinical Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {activeMeds.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">
                            {idx + 1}. {m.name}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {m.dose} ({m.route || 'Oral'})
                          </td>
                          <td className="p-3 text-slate-700">
                            {m.frequency}
                          </td>
                          <td className="p-3 text-slate-500">
                            {m.originFacility || 'Hospital Record'}
                          </td>
                          <td className="p-3 text-slate-600 italic">
                            "{m.rationale}"
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discontinued Medications */}
              {discontinuedMeds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-rose-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>Discontinued / Redundant Medications (Do Not Take)</span>
                  </h4>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-950">
                    {discontinuedMeds.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span><strong>✕ {m.name}</strong> ({m.dose})</span>
                        <span className="italic text-rose-800">Reason: {m.rationale}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Withheld / Unverified Medications */}
              {unverifiedMeds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Withheld / Unverified Medications ({unverifiedMeds.length}) — Not Approved by Physician</span>
                  </h4>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                    {unverifiedMeds.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span><strong>⚠ {m.name}</strong> {m.dose ? `(${m.dose})` : ''}</span>
                        <span className="italic text-amber-800">{m.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Certification & Doctor Signature Block */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-2xl border">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reconciled & Attending Physician</span>
                  <span className="text-sm font-bold text-slate-900">
                    {patient.finalReport?.signedBy || patient.finalizedBy || patient.attendingPhysician}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Department of Clinical Pharmacy & Transitions of Care
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Certification Timestamp</span>
                  <span className="text-xs font-semibold text-slate-800 block">
                    {patient.finalReport?.generatedAt || patient.finalizedAt || 'September 25, 2026, 22:42'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold block mt-0.5">
                    DIGITALLY SIGNED & VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-400">
                Official patient discharge copy generated by ReconRx Clinical Platform
              </span>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
