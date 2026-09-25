import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Mail, 
  UserCheck, 
  FileCheck2,
  Activity,
  AlertCircle,
  Stethoscope,
  CheckCircle2,
  X
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';
import { CURRENT_USER } from '../../data/mockData';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isUnauthorized = searchParams.get('unauthorized') === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentDoctorEmails, setRecentDoctorEmails] = useState<string[]>(() => {
    try {
      const history = JSON.parse(localStorage.getItem('reconrx_doctor_email_history') || '[]');
      if (Array.isArray(history) && history.length > 0) return history;
      const prior = localStorage.getItem('reconrx_prior_doctor_email');
      return prior ? [prior] : [];
    } catch {
      return [];
    }
  });

  const filteredSuggestions = recentDoctorEmails.filter(
    (e) => !email.trim() || e.toLowerCase().includes(email.toLowerCase().trim())
  );

  const { setCurrentUser } = useReconciliation();
  const navigate = useNavigate();

  const saveDoctorEmail = (emailToSave: string) => {
    const trimmed = emailToSave.trim();
    if (!trimmed) return;
    localStorage.setItem('reconrx_prior_doctor_email', trimmed);
    const updated = [trimmed, ...recentDoctorEmails.filter(e => e.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    localStorage.setItem('reconrx_doctor_email_history', JSON.stringify(updated));
    setRecentDoctorEmails(updated);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your hospital clinical email.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setError(null);

    // Save the prior entered doctor email ID
    saveDoctorEmail(email);

    // Derive physician name dynamically from the entered email ID
    const userPart = email.trim().split('@')[0] || '';
    const clean = userPart.replace(/^dr\.?/i, '');
    const words = clean.split(/[._-]+/).filter(Boolean);
    const doctorName = words.length > 0 
      ? `Dr. ${words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}`
      : 'Dr. Physician';

    setCurrentUser({
      ...CURRENT_USER,
      name: doctorName,
      email: email.trim(),
      userType: 'doctor',
      role: 'Doctor / Healthcare Professional'
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row font-sans selection:bg-brand-500 selection:text-white">
      {/* Left Column: Brand & Clinical Mission */}
      <div className="lg:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 border-r border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
            <span className="text-2xl tracking-tighter">Rx</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ReconRx
              <span className="text-xs font-semibold px-2 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-md">
                Clinical AI Copilot
              </span>
            </span>
            <p className="text-xs text-slate-400">Intelligent Medication Reconciliation</p>
          </div>
        </div>

        {/* Center Taglines & Healthcare Value Prop */}
        <div className="my-12 z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-navy-700 text-brand-300 text-xs font-medium mb-6">
            <Sparkles size={14} className="text-brand-400" />
            <span>NPSG 03.06.01 Medication Safety Standard</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            From scattered medication records to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-teal-200">one verified story</span>.
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-light mb-8">
            ReconRx doesn’t prescribe — it catches what might otherwise be missed across transitions of care.
          </p>

          {/* Clinical Features Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/60 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileCheck2 size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-white">Discrepancy Intelligence</h4>
                <p className="text-slate-400 mt-0.5">Detects omissions, duplications, and dose discrepancies instantly.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/60 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                <Activity size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-white">80+ Trained DDI Rules</h4>
                <p className="text-slate-400 mt-0.5">Cross-checks DrugBank & Micromedex pharmacological interactions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="z-10 pt-6 border-t border-navy-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Demonstration environment — synthetic patient data</span>
          <span className="hidden sm:inline">Physician & Pharmacist Verified</span>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="lg:w-5/12 bg-slate-900/60 p-8 md:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated p-8 border border-slate-200/80">
          {/* Unauthorized access alert for patient attempting to visit doctor portal */}
          {isUnauthorized && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-900 text-xs animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800">Restricted Clinical Area</p>
                <p className="text-rose-700 mt-0.5">
                  Patient accounts are strictly not authorized to view the hospital registry, DDI rules, or clinical reports. Please log in with authorized healthcare professional credentials.
                </p>
              </div>
            </div>
          )}

          {/* Patient Portal Switch Banner */}
          <div className="mb-5 p-3 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between text-xs text-brand-900">
            <div>
              <span className="font-bold block">Are you a Patient?</span>
              <span className="text-[11px] text-brand-700">Submit your medical prescriptions here</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/login')}
              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
            >
              Patient Portal →
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-brand-600 uppercase tracking-wider mb-1">
              <Lock size={12} />
              <span>Secure Clinical Auth</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor & Healthcare Professional Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Authorized access to patient reconciliation, 80 DDI rules, and clinical reports</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hospital Clinical Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                  placeholder="Enter hospital email ID (e.g. doctor@hospital.com)"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-xs md:text-sm text-slate-800 focus:outline-hidden transition-all"
                  required
                  autoComplete="off"
                />
                {recentDoctorEmails.length > 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSuggestions((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 p-1 rounded-md transition-colors"
                    title="Toggle suggestion cloud (optional)"
                  >
                    <Sparkles size={14} className={showSuggestions ? 'text-brand-600' : ''} />
                  </button>
                )}
              </div>

              {/* Floating Optional Suggestion Cloud */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute top-full left-0 right-0 mt-1.5 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Sparkles size={12} className="text-brand-500" />
                      <span>Recent doctor email suggestions (optional)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('reconrx_prior_doctor_email');
                          localStorage.removeItem('reconrx_doctor_email_history');
                          setRecentDoctorEmails([]);
                          setShowSuggestions(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                        title="Clear remembered emails"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                        title="Close"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Suggestion Cloud of recent emails */}
                  <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setEmail(item);
                          setShowSuggestions(false);
                        }}
                        className="px-3 py-1 bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs group cursor-pointer"
                      >
                        <span className="text-[10px] text-slate-400 group-hover:text-brand-500">☁</span>
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-xs md:text-sm text-slate-800 focus:outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              className="w-full mt-3 py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl text-xs md:text-sm flex items-center justify-center space-x-2 transition-all shadow-md group"
            >
              <span>Sign In to Doctor Portal</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Clinical Security Notice */}
          <div className="mt-6 flex items-start space-x-2 text-[11px] text-slate-500 leading-snug">
            <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              ReconRx Clinical Copilot session protected by hospital patient safety protocols and The Joint Commission NPSG 03.06.01.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
