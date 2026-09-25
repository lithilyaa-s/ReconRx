import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GitCompare, 
  Clock, 
  FileText, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, selectedPatient, resetToDemo, setCurrentUser } = useReconciliation();
  const navigate = useNavigate();

  const patientId = selectedPatient?.id || 'p-10291';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Patients', icon: Users, path: '/patients' },
    { label: 'Reconciliation', icon: GitCompare, path: `/reconciliation/${patientId}`, badge: selectedPatient?.discrepancies.filter(d => d.status === 'REQUIRES_REVIEW').length },
    { label: 'Medication Timeline', icon: Clock, path: `/timeline/${patientId}` },
    { label: 'Reports', icon: FileText, path: `/reports/${patientId}` },
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Help & Clinical FAQ', icon: HelpCircle, path: '/help' },
  ];

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  const content = (
    <div className={`flex flex-col h-full bg-navy-900 text-slate-300 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} select-none`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20 flex-shrink-0">
            <span className="text-xl tracking-tighter">Rx</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                ReconRx
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wide font-medium">Medication Reconciliation</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-slate-200 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Clinical Status Banner */}
      {!collapsed ? (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-navy-800/80 border border-navy-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-brand-300">
            <Sparkles size={14} className="text-teal-400" />
            <span className="font-medium text-[11px]">Clinical Safety CDS</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-navy-800/80 hover:text-slate-100'
              } ${collapsed ? 'justify-center' : 'justify-between'}`
            }
            title={collapsed ? item.label : undefined}
          >
            <div className="flex items-center space-x-3">
              <item.icon size={19} className="flex-shrink-0 group-hover:text-brand-300 transition-colors" />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-clinical-amber/20 text-amber-300 border border-amber-500/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Clinical Safety Notice */}
      {!collapsed && (
        <div className="mx-3 my-1.5 p-2 rounded-lg bg-navy-800/50 border border-navy-700/40 text-[11px] text-slate-400 leading-tight">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-0.5">
            <ShieldAlert size={12} />
            <span>Decision Support Tool</span>
          </div>
          <span>ReconRx does not prescribe. Doctor sign-off required.</span>
        </div>
      )}

      {/* Switch to Patient Portal button */}
      {!collapsed ? (
        <div className="mx-3 mb-2">
          <button
            onClick={() => {
              navigate('/patient/dashboard');
            }}
            className="w-full py-1.5 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span>Patient Portal View</span>
            <span className="text-[10px] bg-teal-500/20 px-1.5 py-0.2 rounded text-teal-200">Switch →</span>
          </button>
        </div>
      ) : null}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/40">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-brand-400/40">
                {currentUser?.name ? currentUser.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() : 'D'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-navy-900" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-100 truncate">{currentUser?.name || 'Dr. Ananya Sharma'}</span>
                <span className="text-[11px] text-slate-400 truncate">{currentUser?.role || 'Doctor / Healthcare Professional'}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 flex-shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setMobileOpen && setMobileOpen(false)} />
          <div className="relative z-10 w-72 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
