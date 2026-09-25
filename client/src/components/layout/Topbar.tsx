import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Menu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck,
  ChevronDown,
  User,
  X
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

interface TopbarProps {
  onMobileMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuClick }) => {
  const { 
    currentUser, 
    notifications, 
    markNotificationRead, 
    patients, 
    selectedPatient, 
    setSelectedPatientId,
    searchQuery,
    setSearchQuery
  } = useReconciliation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [patientSelectorOpen, setPatientSelectorOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Search matches
  const searchResults = searchQuery.trim().length > 1 ? patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.encounter.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sources.some(s => s.medications.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())))
  ) : [];

  // Breadcrumb helper
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return { title: 'Dashboard', crumb: 'Clinical Overview' };
    if (path.startsWith('/patients') && path.length > 9) return { title: selectedPatient?.name || 'Patient Detail', crumb: 'Patients / Detail' };
    if (path.startsWith('/patients')) return { title: 'Patient Registry', crumb: 'Patients / All' };
    if (path.startsWith('/reconciliation')) return { title: 'Medication Reconciliation Workbench', crumb: `Reconciliation / ${selectedPatient?.name || 'Workspace'}` };
    if (path.startsWith('/timeline')) return { title: 'Medication Journey Timeline', crumb: `Timeline / ${selectedPatient?.name || 'Patient'}` };
    if (path.startsWith('/reports')) return { title: 'Reconciliation Clinical Summary', crumb: `Reports / ${selectedPatient?.name || 'Patient'}` };
    if (path.startsWith('/settings')) return { title: 'Application Settings', crumb: 'System / Preferences' };
    if (path.startsWith('/help')) return { title: 'Clinical Decision Support Guidelines & Help', crumb: 'Support / Documentation' };
    return { title: 'ReconRx', crumb: 'Clinical Portal' };
  };

  const { title, crumb } = getPageTitle();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Open mobile menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{crumb}</span>
          <h1 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            {title}
            {location.pathname.startsWith('/reconciliation') && selectedPatient && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                {selectedPatient.patientId}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Middle: Global Search Bar */}
      <div className="hidden lg:block relative w-80 xl:w-96">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, ID, or medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-100 hover:bg-slate-150 focus:bg-white border border-transparent focus:border-brand-500 rounded-lg text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-elevated p-2 z-50 max-h-80 overflow-y-auto">
            <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Matching Patients</div>
            {searchResults.map((patient) => (
              <div
                key={patient.id}
                onClick={() => {
                  setSelectedPatientId(patient.id);
                  setSearchQuery('');
                  setSearchFocused(false);
                  navigate(`/patients/${patient.id}`);
                }}
                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">{patient.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({patient.patientId})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{patient.encounter} • {patient.sources[0]?.medications.length || 0} meds</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 font-medium rounded-full ${
                  patient.reconciliationStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                  patient.reconciliationStatus === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {patient.reconciliationStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Patient Switcher, Notifications, User */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Active Patient Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setPatientSelectorOpen(!patientSelectorOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            <User size={14} className="text-brand-600" />
            <span className="hidden sm:inline font-semibold">{selectedPatient?.name}</span>
            <span className="font-mono text-slate-500">({selectedPatient?.patientId})</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {patientSelectorOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-elevated p-1.5 z-50">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Select Patient</div>
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setPatientSelectorOpen(false);
                    // Stay on corresponding section
                    if (location.pathname.startsWith('/reconciliation')) {
                      navigate(`/reconciliation/${p.id}`);
                    } else if (location.pathname.startsWith('/patients/')) {
                      navigate(`/patients/${p.id}`);
                    } else if (location.pathname.startsWith('/timeline/')) {
                      navigate(`/timeline/${p.id}`);
                    } else if (location.pathname.startsWith('/reports/')) {
                      navigate(`/reports/${p.id}`);
                    }
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    p.id === selectedPatient?.id ? 'bg-brand-50 text-brand-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.patientId} • {p.encounter}</span>
                  </div>
                  {p.reconciliationStatus === 'Completed' ? (
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-elevated p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Notifications & Alerts</span>
                <span className="text-[10px] text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setSelectedPatientId(n.patientId);
                      setNotificationsOpen(false);
                      navigate(`/reconciliation/${n.patientId}`);
                    }}
                    className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-2.5 ${
                      !n.read ? 'bg-brand-50/40' : ''
                    }`}
                  >
                    {n.priority === 'high' ? (
                      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FileCheck size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Safety Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-medium">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-[11px]">Clinical CDS Active</span>
        </div>
      </div>
    </header>
  );
};
