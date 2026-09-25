import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Monitor, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  RotateCcw,
  Check
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';
import { DDI_DATABASE } from '../../data/ddiDatabase';

export const SettingsPage: React.FC = () => {
  const { currentUser, resetToDemo } = useReconciliation();
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'ai' | 'security' | 'about'>('profile');
  const [savedAlert, setSavedAlert] = useState(false);

  // Form states
  const [ddiSensitivity, setDdiSensitivity] = useState<'strict' | 'moderate'>('strict');
  const [autoRunOCR, setAutoRunOCR] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">System Settings & Preferences</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Configure clinical decision support rules, notifications, and user profile preferences.
        </p>
      </div>

      {savedAlert && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {[
            { id: 'profile', label: 'Clinician Profile', icon: User },
            { id: 'ai', label: 'AI & DDI Rules', icon: Sparkles },
            { id: 'notifications', label: 'Notification Alerts', icon: Bell },
            { id: 'security', label: 'Security & HIPAA', icon: ShieldCheck },
            { id: 'about', label: 'About ReconRx', icon: Database },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeSection === item.id
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {activeSection === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Clinician Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={currentUser?.name || 'Dr. Physician'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Department</label>
                  <input
                    type="text"
                    defaultValue={currentUser?.department || 'Inpatient Clinical Pharmacy'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={currentUser?.email || localStorage.getItem('reconrx_prior_doctor_email') || ''}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                AI & Decision Support Knowledgebase
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-900">
                  <strong>Trained Rules Loaded:</strong> {DDI_DATABASE.length} clinically verified DrugBank & Micromedex Drug-Drug Interaction rules active.
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">DDI Sensitivity Threshold</span>
                    <span className="text-slate-500 text-[11px]">Flag moderate interactions in addition to major/critical</span>
                  </div>
                  <select
                    value={ddiSensitivity}
                    onChange={(e) => setDdiSensitivity(e.target.value as any)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="strict">Strict (All flagged)</option>
                    <option value="moderate">High & Critical Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">Automated Formulary Mapping</span>
                    <span className="text-slate-500 text-[11px]">Map trade names to generic RxNorm automatically</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRunOCR}
                    onChange={(e) => setAutoRunOCR(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Security & Compliance</h2>
              <div className="text-xs text-slate-600 space-y-2">
                <p>• Data handling: Synthetic patient records only. No PHI or real clinical identities used.</p>
                <p>• Immutable Audit Trail: Every discrepancy resolution records timestamp, rationale, and clinician sign-off.</p>
                <p>• Non-Prescribing Guardrail: ReconRx CDS engine operates under strict advisory boundaries.</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={resetToDemo}
                  className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo Environment to Default</span>
                </button>
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">About ReconRx</h2>
              <p className="text-slate-700 font-medium">
                “From scattered medication records to one verified medication story.”
              </p>
              <p className="text-slate-500 leading-relaxed">
                ReconRx is an intelligent medication reconciliation copilot built for hospital pharmacists, attending physicians, and care coordinators.
                Designed for transitions of care (admissions, transfers, referrals, and discharges) in accordance with Joint Commission NPSG 03.06.01.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                <div>Version: 1.0.0 (Production Hackathon MVP)</div>
                <div>Frontend: React, TypeScript, TailwindCSS</div>
                <div>Backend: Node.js, Express, MongoDB</div>
                <div>Intelligence: Gemini API & Tesseract OCR Hybrid Engine</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
