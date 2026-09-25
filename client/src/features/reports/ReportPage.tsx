import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  UserCheck, 
  ArrowLeft,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, currentUser } = useReconciliation();
  const navigate = useNavigate();

  const patient = patients.find(p => p.id === id) || patients[0];

  // Set of medication names that were detected as POTENTIAL_OMISSION
  const omissionMedNames = new Set(
    patient.discrepancies
      .filter(d => d.type === 'POTENTIAL_OMISSION')
      .map(d => d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim().toLowerCase())
  );

  // CRITICAL SAFETY RULE: Only doctor-verified and approved medications are included in the report!
  // USER SAFETY RULE: For whatever medicine it has been detected as POTENTIAL OMISSION,
  // after verification by the doctor, it should get removed from the report of the patient!
  const verifiedDiscrepancies = patient.discrepancies.filter(d => d.status === 'REVIEWED' && d.type !== 'POTENTIAL_OMISSION');

  const rawApprovedMedications = patient.finalReport?.reconciledMedications || verifiedDiscrepancies.map(d => ({
    name: d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim(),
    dose: d.currentRecord?.dose || d.previousRecord?.dose || 'Standard dose',
    frequency: d.currentRecord?.frequency || d.previousRecord?.frequency || 'Once daily',
    route: d.currentRecord?.route || d.previousRecord?.route || 'Oral',
    action: d.resolution?.action ? d.resolution.action.replace(/_/g, ' ') : 'Verified Safe by Doctor',
    rationale: d.resolution?.rationale || 'Clinically validated and verified safe by attending physician.',
    status: d.resolution?.action === 'CONFIRM_DISCONTINUED' || d.resolution?.action === 'CONFIRM_DUPLICATE'
      ? ('Discontinued' as const)
      : d.resolution?.action === 'MARK_FURTHER_REVIEW'
      ? ('Held' as const)
      : ('Active' as const),
    prescribingDoctor: d.resolution?.reviewedBy || currentUser?.name || patient.attendingPhysician,
    originFacility: d.previousRecord?.sourceName || patient.sources[0]?.facility || 'Hospital Record',
    verifiedByDoctor: true
  }));

  // Explicitly remove any potential omission from the active patient report
  const approvedMedications = rawApprovedMedications.filter(m => !omissionMedNames.has(m.name.toLowerCase()));

  const unverifiedItems = (patient.finalReport?.unverifiedMedications || patient.discrepancies
    .filter(d => d.status !== 'REVIEWED' && d.type !== 'POTENTIAL_OMISSION')
    .map(d => ({
      name: d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim(),
      dose: d.currentRecord?.dose || d.previousRecord?.dose || 'Standard dose',
      frequency: d.currentRecord?.frequency || d.previousRecord?.frequency || 'Unscheduled',
      reason: 'Withheld from patient regimen — not verified by attending physician for safety.'
    }))).filter(m => !omissionMedNames.has(m.name.toLowerCase()));

  const activeMeds = approvedMedications.filter(m => m.status === 'Active' || m.status === 'Modified');
  const discontinuedMeds = approvedMedications.filter(m => m.status === 'Discontinued' || m.status === 'Held');
  const reviewerName = patient.finalReport?.signedBy || patient.finalizedBy || currentUser?.name || patient.attendingPhysician;
  const reportDate = patient.finalReport?.generatedAt || patient.finalizedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const isFinalized = patient.reconciliationStatus === 'Completed' || !!patient.finalReport;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportText = `
=====================================================
RECONRX — OFFICIAL MEDICATION RECONCILIATION SUMMARY
Joint Commission NPSG 03.06.01 Medication Safety Standard
=====================================================

Patient Name:        ${patient.name}
Patient ID (MRN):    ${patient.patientId}
Age / Gender:        ${patient.age} / ${patient.gender}
Encounter:           ${patient.encounter} (${patient.room || 'General Ward'})
Attending Doctor:    ${patient.attendingPhysician}
Known Allergies:     ${patient.allergies.join(', ') || 'None documented (NKDA)'}
Certification Date:  ${reportDate}
Reconciled By:       ${reviewerName}
Safety Status:       ONLY DOCTOR-VERIFIED MEDICATIONS APPROVED FOR ACTIVE USE

-----------------------------------------------------
SUBMITTED HOSPITAL PRESCRIPTIONS REVIEWED (${patient.sources.length})
-----------------------------------------------------
${patient.sources.map((s, idx) => `[${idx + 1}] ${s.facility || 'Hospital'} (${s.date}) — ${s.medications.length} medication(s) reported`).join('\n')}

-----------------------------------------------------
APPROVED ACTIVE DAILY MEDICATION REGIMEN (TAKE AS DIRECTED)
-----------------------------------------------------
${activeMeds.length > 0 ? activeMeds.map((m, idx) => `
${idx + 1}. ${m.name.toUpperCase()} — ${m.dose}
   - Route & Timing:  ${m.route || 'Oral'}, ${m.frequency}
   - Verification:    Doctor Verified & Approved
   - Prescribing Dr:  ${m.prescribingDoctor || reviewerName}
   - Origin:          ${m.originFacility || 'Hospital Record'}
   - Clinical Rationale: "${m.rationale}"
`).join('') : 'No active medications approved.'}

${discontinuedMeds.length > 0 ? `
-----------------------------------------------------
DISCONTINUED / HELD MEDICATIONS (DO NOT TAKE)
-----------------------------------------------------
${discontinuedMeds.map((m, idx) => `
[STOP] ${m.name} (${m.dose}) — Reason: ${m.rationale}
`).join('')}
` : ''}

${unverifiedItems.length > 0 ? `
-----------------------------------------------------
WITHHELD / UNVERIFIED MEDICATIONS (NOT APPROVED FOR PATIENT USE)
-----------------------------------------------------
${unverifiedItems.map((u, idx) => `
[WITHHELD] ${u.name} (${u.dose || 'Standard'}) — Reason: ${u.reason}
`).join('')}
` : ''}

-----------------------------------------------------
CLINICAL SIGN-OFF & CERTIFICATION
-----------------------------------------------------
ReconRx Clinical Decision-Support Platform v2.4
I confirm that I have validated the patient's care-transition medication list.
Only the verified medications in this document are approved for the patient.
Electronically Verified & Signed by: ${reviewerName}
Date & Timestamp: ${reportDate}
Status: ${isFinalized ? 'OFFICIALLY FINALIZED & ROUTED TO PATIENT DASHBOARD' : 'DRAFT REPORT'}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReconRx_Official_Report_${patient.patientId}_${patient.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Medication Reconciliation Report</h1>
            <p className="text-xs text-slate-500">
              Official transition-of-care summary • <strong>Only doctor-verified medicines are approved and routed to the patient dashboard</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Download Summary</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Clinical Report</span>
          </button>
        </div>
      </div>

      {/* Printable Clinical Document Card */}
      <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-card max-w-4xl mx-auto space-y-6 text-xs text-slate-800">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-extrabold flex items-center justify-center text-xl shadow-md shadow-brand-500/20">
              Rx
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ReconRx Health System
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {isFinalized ? 'Patient Portal Live' : 'Verified Clinical Draft'}
                </span>
              </span>
              <p className="text-xs text-slate-500">Department of Clinical Pharmacy & Care Transitions</p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="font-mono text-xs font-bold text-slate-900 block">FORM 03-MED-REC</span>
            <span className="text-[11px] text-slate-500">Date: {reportDate}</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {isFinalized ? '✓ Synced with Patient Dashboard' : '• Reconciliation in Progress'}
            </span>
          </div>
        </div>

        {/* Patient Demographics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block">Patient ID / MRN</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{patient.patientId}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block">Encounter Type</span>
            <span className="font-semibold text-slate-800 text-xs">{patient.encounter}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block">Attending Physician</span>
            <span className="font-semibold text-slate-800 text-xs">{patient.attendingPhysician}</span>
          </div>
        </div>

        {/* Doctor Safety Validation Notice Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-start sm:items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Doctor Safety Validation Certified:</strong> This report includes <strong>ONLY</strong> medications validated and verified for safety by <strong>{reviewerName}</strong>. These verified medications are transmitted identically to {patient.name}'s Patient Dashboard.
            </span>
          </div>
          <span className="font-semibold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-300 self-start sm:self-auto whitespace-nowrap shadow-2xs">
            ✓ {activeMeds.length} Approved Active
          </span>
        </div>

        {/* Cross-Referenced Prescriptions */}
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

        {/* Approved Doctor-Verified Regimen Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck size={14} className="text-emerald-600" />
            <span>Approved & Doctor-Verified Active Regimen ({activeMeds.length})</span>
          </h4>

          {activeMeds.length === 0 ? (
            <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center text-amber-900 space-y-1">
              <AlertTriangle size={20} className="mx-auto text-amber-600" />
              <p className="font-bold">No medications have been verified yet.</p>
              <p className="text-[11px] text-amber-800">
                Please return to the Reconciliation Workbench to review and verify medications for safety before final approval.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="p-3">Medication</th>
                    <th className="p-3">Dose & Route</th>
                    <th className="p-3">Directions / Frequency</th>
                    <th className="p-3">Verification Status</th>
                    <th className="p-3">Facility / Origin</th>
                    <th className="p-3">Clinical Justification</th>
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
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          Doctor Verified
                        </span>
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
          )}
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
        {unverifiedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Withheld / Unverified Items ({unverifiedItems.length}) — Not Approved for Patient</span>
            </h4>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
              {unverifiedItems.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span><strong>⚠ {u.name}</strong> {u.dose ? `(${u.dose})` : ''}</span>
                  <span className="italic text-amber-800">{u.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Sign-Off Box */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 pt-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle2 size={16} />
            <span>Medication Reconciliation Verified & Signed Off</span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            I confirm that I have validated the patient's care-transition medication list. Only the verified medications in this document are approved for the patient's active regimen. All care transition decisions have been reconciled in accordance with hospital patient safety protocols and The Joint Commission NPSG 03.06.01.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-slate-600">
            <div>
              <span className="block text-[10px] uppercase text-slate-400 font-semibold">Authorized Reviewer</span>
              <span className="font-bold text-slate-900 text-xs block">{reviewerName}</span>
              <span className="text-[10px] text-slate-400">{currentUser?.role || 'Doctor / Healthcare Professional'}, Inpatient Care</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-400 font-semibold">Sign-Off Date & Timestamp</span>
              <span className="font-mono text-xs text-slate-800 block">{reportDate}</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold block mt-0.5">
                DIGITALLY SIGNED & SYNCED TO PATIENT DASHBOARD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
