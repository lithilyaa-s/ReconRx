import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Mail, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles, 
  Stethoscope,
  Building2,
  FileCheck2,
  X
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

export const PatientLoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentPatientEmails, setRecentPatientEmails] = useState<string[]>(() => {
    try {
      const history = JSON.parse(localStorage.getItem('reconrx_patient_email_history') || '[]');
      if (Array.isArray(history) && history.length > 0) return history;
      const prior = localStorage.getItem('reconrx_prior_patient_email');
      return prior ? [prior] : ['ravi.kumar@patient-portal.in'];
    } catch {
      return ['ravi.kumar@patient-portal.in'];
    }
  });

  const filteredSuggestions = recentPatientEmails.filter(
    (e) => !email.trim() || e.toLowerCase().includes(email.toLowerCase().trim())
  );
  
  // Registration form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState(45);
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAllergies, setRegAllergies] = useState('');
  const [regHospital, setRegHospital] = useState('');

  const { loginAsPatient, registerNewPatient } = useReconciliation();
  const navigate = useNavigate();

  const savePatientEmail = (emailToSave: string) => {
    const trimmed = emailToSave.trim();
    if (!trimmed) return;
    localStorage.setItem('reconrx_prior_patient_email', trimmed);
    const updated = [trimmed, ...recentPatientEmails.filter(e => e.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    localStorage.setItem('reconrx_patient_email_history', JSON.stringify(updated));
    setRecentPatientEmails(updated);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = loginAsPatient(email, password);
    if (!res.success) {
      setLoginError(res.message || 'Unable to sign in with this email');
      return;
    }
    savePatientEmail(email);
    navigate('/patient/dashboard');
  };

  const handleDemoPatient = () => {
    savePatientEmail('ravi.kumar@patient-portal.in');
    setEmail('ravi.kumar@patient-portal.in');
    loginAsPatient('p-10291');
    navigate('/patient/dashboard');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    const allergiesList = regAllergies.split(',').map(a => a.trim()).filter(Boolean);
    registerNewPatient(
      regName.trim(), 
      regAge, 
      regGender, 
      allergiesList, 
      regHospital.trim(),
      regEmail.trim(),
      regPassword.trim()
    );

    // Save registered email to the sign-in state and storage
    savePatientEmail(regEmail.trim());
    setEmail(regEmail.trim());
    setPassword(regPassword.trim() || '••••••••');
    navigate('/patient/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row font-sans selection:bg-brand-500 selection:text-white">
      {/* Left Column: Patient Care Mission */}
      <div className="lg:w-6/12 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 border-r border-slate-800">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
            <span className="text-2xl tracking-tighter">Rx</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ReconRx
              <span className="text-xs font-semibold px-2 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-md">
                Patient Portal
              </span>
            </span>
            <p className="text-xs text-slate-400">Personal Medication Intake & Safety Verification</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="my-10 z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-navy-700 text-brand-300 text-xs font-medium">
            <Sparkles size={14} className="text-brand-400" />
            <span>Transitions of Care Patient Safety</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Submit your prescriptions from <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-teal-200">any hospital</span>.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-light">
            When you visit multiple hospitals or clinics, dangerous duplicate drugs and dosing discrepancies can happen. Submit your prescriptions here so our hospital clinical pharmacy can reconcile and verify your medication story.
          </p>

          <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/60 space-y-2 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <CheckCircle2 size={16} />
              <span>How It Works for You:</span>
            </div>
            <p>1. Upload or list prescriptions from past clinic or hospital visits.</p>
            <p>2. Clinical pharmacy compares them with your current hospital orders.</p>
            <p>3. Your doctor finalizes the verified plan and sends it straight to your dashboard.</p>
          </div>
        </div>

        {/* Bottom Switcher to Doctor Portal */}
        <div className="z-10 pt-6 border-t border-navy-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Are you a physician or clinical staff?</span>
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
            <Stethoscope size={14} />
            <span>Go to Doctor Portal →</span>
          </Link>
        </div>
      </div>

      {/* Right Column: Login or Registration Card */}
      <div className="lg:w-6/12 bg-slate-900/60 p-6 md:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated p-8 border border-slate-200/80">
          {/* Tabs: Sign In vs Register */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
            <button
              onClick={() => { setIsRegistering(false); setLoginError(null); }}
              className={`flex-1 py-2 text-center rounded-lg transition-all ${
                !isRegistering ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Patient Sign In
            </button>
            <button
              onClick={() => { setIsRegistering(true); setLoginError(null); }}
              className={`flex-1 py-2 text-center rounded-lg transition-all ${
                isRegistering ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register as New Patient
            </button>
          </div>

          {!isRegistering ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <span>{loginError}</span>
                </div>
              )}

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Email ID or Patient MRN
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                    placeholder="e.g. your.email@example.com or P-10291"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                    required
                    autoComplete="off"
                  />
                  {recentPatientEmails.length > 0 && (
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
                        <span>Recent email suggestions (optional)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('reconrx_prior_patient_email');
                            localStorage.removeItem('reconrx_patient_email_history');
                            setRecentPatientEmails([]);
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-hidden focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <span>Sign In to Patient Portal</span>
                <ArrowRight size={16} />
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-[11px] text-slate-400 uppercase tracking-wider">
                  Active Patient Record
                </span>
              </div>

              <button
                type="button"
                onClick={handleDemoPatient}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors border border-slate-200"
              >
                <User size={15} className="text-brand-600" />
                <span>Sign in as Ravi Kumar (P-10291)</span>
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              {/* Login Email ID (used for registration & sign-in) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Login Email ID *
                  <span className="text-[10px] text-brand-600 font-normal ml-1.5">(Used for sign in)</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.patel@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={regAge}
                    onChange={(e) => setRegAge(parseInt(e.target.value) || 30)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Hospital / Clinic</label>
                <input
                  type="text"
                  placeholder="e.g. City General Hospital"
                  value={regHospital}
                  onChange={(e) => setRegHospital(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Known Drug Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa (or leave blank if None)"
                  value={regAllergies}
                  onChange={(e) => setRegAllergies(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <PlusCircle size={16} />
                <span>Complete Registration & Enter Portal</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>ReconRx Patient Health Record Privacy Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
