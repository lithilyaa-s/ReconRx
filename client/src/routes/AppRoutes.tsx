import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { PatientLoginPage } from '../features/patient-portal/PatientLoginPage';
import { PatientDashboard } from '../features/patient-portal/PatientDashboard';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PatientsPage } from '../features/patients/PatientsPage';
import { PatientDetailPage } from '../features/patients/PatientDetailPage';
import { ReconciliationPage } from '../features/reconciliation/ReconciliationPage';
import { TimelinePage } from '../features/timeline/TimelinePage';
import { MedicationDetailPage } from '../features/medications/MedicationDetailPage';
import { ReportPage } from '../features/reports/ReportPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { HelpPage } from '../features/help/HelpPage';
import { useReconciliation } from '../context/ReconciliationContext';

// Guard ensuring ONLY doctors/admins can access full clinical tools
const DoctorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useReconciliation();

  if (!currentUser || currentUser.userType !== 'doctor') {
    // If not authenticated as doctor, enforce login with warning if coming from patient account
    return <Navigate to={`/doctor/login${currentUser?.userType === 'patient' ? '?unauthorized=true' : ''}`} replace />;
  }

  return <>{children}</>;
};

// Guard ensuring patient portal is accessed by authenticated patient user
const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useReconciliation();

  if (!currentUser || currentUser.userType !== 'patient') {
    return <Navigate to="/patient/login" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { currentUser } = useReconciliation();

  const getRootRedirect = () => {
    if (!currentUser) return '/login';
    if (currentUser.userType === 'patient') return '/patient/dashboard';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Public Role Login Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/doctor/login" element={<LoginPage />} />
      <Route path="/patient/login" element={<PatientLoginPage />} />

      {/* Patient Portal Routes */}
      <Route 
        path="/patient/dashboard" 
        element={
          <PatientRoute>
            <PatientDashboard />
          </PatientRoute>
        } 
      />
      <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />

      {/* Doctor / Clinical Admin Portal Routes (Protected) */}
      <Route 
        element={
          <DoctorRoute>
            <AppLayout />
          </DoctorRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/reconciliation/:id" element={<ReconciliationPage />} />
        <Route path="/medications/:id" element={<MedicationDetailPage />} />
        <Route path="/timeline/:id" element={<TimelinePage />} />
        <Route path="/reports/:id" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      {/* Root Dynamic Redirect */}
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={getRootRedirect()} replace />} />
    </Routes>
  );
};
