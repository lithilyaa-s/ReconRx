import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FloatingAiAssistant } from '../../features/reconciliation/FloatingAiAssistant';
import { AIExplanationDrawer } from '../../features/reconciliation/AIExplanationDrawer';
import { useReconciliation } from '../../context/ReconciliationContext';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { 
    isAiDrawerOpen, 
    setIsAiDrawerOpen, 
    activeDiscrepancyForAi, 
    resolveDiscrepancy, 
    selectedPatient 
  } = useReconciliation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar onMobileMenuClick={() => setMobileOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Ask ReconRx Copilot */}
      <FloatingAiAssistant />

      {/* Global AI Explanation Drawer */}
      <AIExplanationDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        discrepancy={activeDiscrepancyForAi}
        onResolve={(action, rationale) => {
          if (selectedPatient && activeDiscrepancyForAi) {
            resolveDiscrepancy(selectedPatient.id, activeDiscrepancyForAi.id, action, rationale);
          }
        }}
      />
    </div>
  );
};
