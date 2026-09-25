import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Patient, 
  UserProfile, 
  DiscrepancyItem, 
  ResolutionAction, 
  ActivityLog, 
  NotificationItem,
  MedicationSource,
  MedicationItem,
  FinalReconciledReport
} from '../types';
import { INITIAL_PATIENTS, CURRENT_USER, INITIAL_ACTIVITIES, INITIAL_NOTIFICATIONS } from '../data/mockData';
import { runReconciliationAlgorithm } from '../utils/reconciliationEngine';

interface ReconciliationContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  setSelectedPatientId: (id: string) => void;
  resolveDiscrepancy: (
    patientId: string, 
    discrepancyId: string, 
    action: ResolutionAction, 
    rationale: string,
    updates?: Partial<DiscrepancyItem>
  ) => void;
  finalizeReconciliation: (patientId: string) => void;
  runReconciliation: (patientId: string) => Promise<void>;
  resetToDemo: () => void;
  activities: ActivityLog[];
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  activeDiscrepancyForAi: DiscrepancyItem | null;
  setActiveDiscrepancyForAi: (item: DiscrepancyItem | null) => void;
  // Patient Portal additions
  addPatientSubmittedSource: (patientId: string, source: MedicationSource) => void;
  updatePatientSubmittedSource: (patientId: string, updatedSource: MedicationSource) => void;
  deletePatientSubmittedSource: (patientId: string, sourceId: string) => void;
  registerNewPatient: (
    name: string, 
    age: number, 
    gender: 'Male' | 'Female' | 'Other', 
    allergies: string[], 
    primaryHospital: string,
    email: string,
    password?: string
  ) => string;
  loginAsPatient: (identifier?: string, password?: string) => { success: boolean; message?: string };
  loginAsDoctor: () => void;
  quickVerifyDiscrepancy: (patientId: string, discrepancyId: string) => void;
  verifyAllRemaining: (patientId: string, rationale?: string) => void;
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined);

export const ReconciliationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('reconrx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('reconrx_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [selectedPatientId, setSelectedPatientIdState] = useState<string>('p-10291');
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('reconrx_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('reconrx_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [activeDiscrepancyForAi, setActiveDiscrepancyForAi] = useState<DiscrepancyItem | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('reconrx_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('reconrx_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('reconrx_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('reconrx_user', JSON.stringify(currentUser));
      // The doctor who logged in is assigned as the attending doctor for the patient
      if (currentUser.userType === 'doctor' && currentUser.name) {
        setPatients(prev => {
          const needsUpdate = prev.some(p => p.attendingPhysician !== currentUser.name);
          if (!needsUpdate) return prev;
          const updated = prev.map(p => ({
            ...p,
            attendingPhysician: currentUser.name
          }));
          localStorage.setItem('reconrx_patients', JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      sessionStorage.removeItem('reconrx_user');
    }
  }, [currentUser]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  const setSelectedPatientId = (id: string) => {
    setSelectedPatientIdState(id);
  };

  const resolveDiscrepancy = (
    patientId: string, 
    discrepancyId: string, 
    action: ResolutionAction, 
    rationale: string,
    updates?: Partial<DiscrepancyItem>
  ) => {
    const clinicianName = currentUser?.name || 'Dr. Ananya Sharma';
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
                      ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPatients(prev => prev.map(patient => {
      if (patient.id !== patientId) return patient;

      const updatedDiscrepancies = patient.discrepancies.map(disc => {
        if (disc.id !== discrepancyId) return disc;
        return {
          ...disc,
          ...(updates || {}),
          status: 'REVIEWED' as const,
          resolution: {
            action,
            rationale: rationale || 'Verified and accepted by clinical reviewer.',
            reviewedBy: clinicianName,
            timestamp
          }
        };
      });

      // Check if all are reviewed
      const unreviewedCount = updatedDiscrepancies.filter(d => d.status === 'REQUIRES_REVIEW').length;
      const newStatus = unreviewedCount === 0 ? 'In Progress' : 'Needs Review';

      return {
        ...patient,
        discrepancies: updatedDiscrepancies,
        reconciliationStatus: patient.reconciliationStatus === 'Completed' ? 'Completed' : newStatus,
        lastUpdated: 'Just now'
      };
    }));

    // Add activity log
    const targetPatient = patients.find(p => p.id === patientId);
    const targetDisc = targetPatient?.discrepancies.find(d => d.id === discrepancyId);
    
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId,
      patientName: targetPatient?.name || 'Patient',
      clinicianName,
      action: `Resolved ${targetDisc?.medicationName || 'Discrepancy'}`,
      timestamp,
      details: `Action: ${action}. Rationale: "${rationale || 'Standard clinical verification'}"`,
      type: 'resolution'
    };

    setActivities(prev => [newActivity, ...prev]);
  };

  const quickVerifyDiscrepancy = (patientId: string, discrepancyId: string) => {
    const clinicianName = currentUser?.name || 'Dr. Ananya Sharma';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetPatient = patients.find(p => p.id === patientId);
    const targetDisc = targetPatient?.discrepancies.find(d => d.id === discrepancyId);
    if (!targetDisc) return;

    const action: ResolutionAction = targetDisc.type === 'POTENTIAL_OMISSION' ? 'CONFIRM_DISCONTINUED' : 'VERIFIED_CORRECT';
    const rationale = targetDisc.type === 'POTENTIAL_OMISSION'
      ? 'Validated by attending doctor: Intentionally omitted/held — removed from active patient prescription report.'
      : 'Clinically validated and verified safe by attending doctor.';

    resolveDiscrepancy(patientId, discrepancyId, action, rationale);
  };

  const verifyAllRemaining = (patientId: string, defaultRationale?: string) => {
    const clinicianName = currentUser?.name || 'Dr. Ananya Sharma';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPatients(prev => prev.map(patient => {
      if (patient.id !== patientId) return patient;
      const updatedDiscrepancies = patient.discrepancies.map(disc => {
        if (disc.status === 'REVIEWED') return disc;
        const action: ResolutionAction = disc.type === 'POTENTIAL_OMISSION' ? 'CONFIRM_DISCONTINUED' : 'VERIFIED_CORRECT';
        const rationale = disc.type === 'POTENTIAL_OMISSION'
          ? 'Validated by attending doctor: Intentionally omitted/held — removed from active patient prescription report.'
          : (defaultRationale || 'Clinically validated and verified safe by attending doctor.');
        return {
          ...disc,
          status: 'REVIEWED' as const,
          resolution: {
            action,
            rationale,
            reviewedBy: clinicianName,
            timestamp
          }
        };
      });

      return {
        ...patient,
        discrepancies: updatedDiscrepancies,
        reconciliationStatus: 'In Progress' as const,
        lastUpdated: 'Just now'
      };
    }));
  };

  const finalizeReconciliation = (patientId: string) => {
    const clinicianName = currentUser?.name || 'Dr. Ananya Sharma';
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
                      ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPatients(prev => prev.map(patient => {
      if (patient.id !== patientId) return patient;

      const newTimelineItem = {
        id: `tl-${Date.now()}`,
        date: timestamp,
        title: 'Medication Reconciliation Finalized',
        description: `All care transition discrepancies resolved and verified for safe discharge/inpatient continuation. Signed off by ${clinicianName}. Final report routed to patient dashboard.`,
        type: 'review' as const,
        author: clinicianName
      };

      // Generate the official FinalReconciledReport
      const reviewedSources = patient.sources.map(s => ({
        facility: s.facility || 'Healthcare Clinic',
        date: s.date,
        type: s.type,
        medicationCount: s.medications.length
      }));

      // CRITICAL CLINICAL SAFETY RULE:
      // ONLY medications verified and approved by the doctor (d.status === 'REVIEWED')
      // are approved into the patient's final prescription report!
      const reconciledMedications: FinalReconciledReport['reconciledMedications'] = [];
      const unverifiedMedications: FinalReconciledReport['unverifiedMedications'] = [];
      const omittedMedications: FinalReconciledReport['omittedMedications'] = [];
      const seenMedNames = new Set<string>();

      for (const d of patient.discrepancies) {
        const cleanName = d.medicationName.replace(/\s*\(Allergy Alert\)|\s*\+.*Interaction/i, '').trim();
        if (!cleanName || seenMedNames.has(cleanName.toLowerCase())) continue;
        seenMedNames.add(cleanName.toLowerCase());

        // USER SAFETY REQUIREMENT:
        // For whatever medicine detected as POTENTIAL OMISSION,
        // after verification by the doctor, it MUST get removed from the report of the patient!
        if (d.type === 'POTENTIAL_OMISSION') {
          omittedMedications.push({
            name: cleanName,
            dose: d.previousRecord?.dose,
            frequency: d.previousRecord?.frequency,
            reason: d.resolution?.rationale || 'Omission clinically verified by doctor — removed from active patient prescription report.'
          });
          // Explicitly REMOVE/EXCLUDE from patient prescription report
          continue;
        }

        if (d.status === 'REVIEWED') {
          // Doctor Verified and Validated
          const isDiscontinued = d.resolution?.action === 'CONFIRM_DISCONTINUED' || d.resolution?.action === 'CONFIRM_DUPLICATE';
          const isHold = d.resolution?.action === 'MARK_FURTHER_REVIEW';
          const isModified = d.resolution?.action === 'REVERT_PREVIOUS' || d.resolution?.action === 'SUBSTITUTE_ALTERNATIVE' || d.type.includes('CHANGE');
          
          reconciledMedications.push({
            name: cleanName,
            dose: d.currentRecord?.dose || d.previousRecord?.dose || 'Standard dose',
            frequency: d.currentRecord?.frequency || d.previousRecord?.frequency || 'Once daily',
            route: d.currentRecord?.route || d.previousRecord?.route || 'Oral',
            action: d.resolution?.action ? d.resolution.action.replace(/_/g, ' ') : 'Verified Safe by Doctor',
            rationale: d.resolution?.rationale || 'Clinically validated and verified safe by attending physician.',
            status: isDiscontinued ? 'Discontinued' : isHold ? 'Held' : isModified ? 'Modified' : 'Active',
            prescribingDoctor: d.resolution?.reviewedBy || d.currentRecord?.prescriber || clinicianName,
            originFacility: d.previousRecord?.sourceName || patient.sources[0]?.facility || 'Clinical Record',
            verifiedByDoctor: true
          });
        } else {
          // NOT verified by doctor: Withheld from approved patient prescription report
          unverifiedMedications.push({
            name: cleanName,
            dose: d.currentRecord?.dose || d.previousRecord?.dose,
            frequency: d.currentRecord?.frequency || d.previousRecord?.frequency,
            reason: 'Pending physician safety validation — withheld from active therapy.'
          });
        }
      }

      const finalReport: FinalReconciledReport = {
        id: `rep-${Date.now()}`,
        generatedAt: timestamp,
        signedBy: clinicianName,
        patientId: patient.patientId,
        patientName: patient.name,
        summary: `Medication reconciliation completed across ${reviewedSources.length} care setting(s). ${reconciledMedications.length} medication(s) officially verified & approved for safety by ${clinicianName}.${omittedMedications.length > 0 ? ` ${omittedMedications.length} verified omission(s) removed from patient report.` : ''}${unverifiedMedications.length > 0 ? ` ${unverifiedMedications.length} unverified item(s) withheld from patient therapy.` : ''}`,
        totalPrescriptionsReviewed: reviewedSources.length,
        reviewedSources,
        reconciledMedications,
        unverifiedMedications,
        omittedMedications,
        safetyCheckSummary: {
          ddiCount: patient.discrepancies.filter(d => d.type === 'DRUG_DRUG_INTERACTION').length,
          allergyAlertsCount: patient.discrepancies.filter(d => d.type === 'ALLERGY_CONTRAINDICATION').length,
          omissionsResolvedCount: patient.discrepancies.filter(d => d.type === 'POTENTIAL_OMISSION').length,
          safetyStatus: 'Verified Safe'
        },
        doctorInstructions: `Take all verified active medications strictly as instructed in this schedule. Avoid taking any unverified or discontinued medications from prior prescriptions. Contact Dr. ${clinicianName} for any clinical questions.`
      };

      return {
        ...patient,
        attendingPhysician: clinicianName,
        reconciliationStatus: 'Completed' as const,
        finalizedAt: timestamp,
        finalizedBy: clinicianName,
        finalReport,
        lastUpdated: 'Just now',
        timeline: [...patient.timeline, newTimelineItem]
      };
    }));

    // Add notification
    const targetPatient = patients.find(p => p.id === patientId);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Reconciliation Completed & Routed',
      message: `Verified and finalized medication story for ${targetPatient?.name} (${targetPatient?.patientId}). Final report routed to patient dashboard.`,
      timestamp: 'Just now',
      read: false,
      priority: 'low',
      patientId,
      type: 'finalized'
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Add activity log
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId,
      patientName: targetPatient?.name || 'Patient',
      clinicianName,
      action: 'Reconciliation Finalized & Routed',
      timestamp,
      details: 'Completed verified medication story across care transitions. Routed final report to patient dashboard.',
      type: 'finalization'
    };

    setActivities(prev => [newAct, ...prev]);
  };

  const runReconciliation = async (patientId: string): Promise<void> => {
    const targetPatient = patients.find(p => p.id === patientId);
    if (!targetPatient) return;

    // Gather previous meds and current meds across all sources
    const prevSources = targetPatient.sources.filter(s => s.type === 'Previous Prescription');
    const currSources = targetPatient.sources.filter(s => s.type === 'Current Hospital Record');
    const patSources = targetPatient.sources.filter(s => s.type === 'Patient Medication Record');

    let prevMeds: MedicationItem[] = [];
    let currMeds: MedicationItem[] = [];

    if (currSources.length > 0) {
      currMeds = currSources.flatMap(s => s.medications);
      prevMeds = [...prevSources, ...patSources].flatMap(s => s.medications);
    } else if (targetPatient.sources.length > 1) {
      // Latest source is treated as current, earlier as previous
      currMeds = targetPatient.sources[0].medications;
      prevMeds = targetPatient.sources.slice(1).flatMap(s => s.medications);
    } else if (targetPatient.sources.length === 1) {
      currMeds = targetPatient.sources[0].medications;
      prevMeds = [];
    }

    const computedDiscrepancies = runReconciliationAlgorithm(targetPatient, prevMeds, currMeds);

    setPatients(prev => prev.map(patient => {
      if (patient.id !== patientId) return patient;
      return {
        ...patient,
        discrepancies: computedDiscrepancies,
        reconciliationStatus: computedDiscrepancies.some(d => d.status === 'REQUIRES_REVIEW') ? 'Needs Review' : 'Completed',
        lastUpdated: 'Just now'
      };
    }));

    // Add activity log
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId,
      patientName: targetPatient.name,
      clinicianName: 'ReconRx Copilot',
      action: 'AI Reconciliation Executed',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Analyzed ${prevMeds.length + currMeds.length} records. Identified ${computedDiscrepancies.length} reconciliation elements.`,
      type: 'reconciliation'
    };

    setActivities(prev => [newActivity, ...prev]);
  };

  const resetToDemo = () => {
    localStorage.removeItem('reconrx_patients');
    localStorage.removeItem('reconrx_activities');
    localStorage.removeItem('reconrx_notifications');
    localStorage.removeItem('reconrx_user');
    sessionStorage.removeItem('reconrx_user');
    setPatients(INITIAL_PATIENTS);
    setActivities(INITIAL_ACTIVITIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(null);
    setSelectedPatientIdState('p-10291');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addPatientSubmittedSource = (patientId: string, source: MedicationSource) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        sources: [source, ...p.sources],
        reconciliationStatus: 'Needs Review',
        lastUpdated: 'Just now'
      };
    }));

    const targetPatient = patients.find(p => p.id === patientId);
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId,
      patientName: targetPatient?.name || 'Patient',
      clinicianName: 'Patient Portal',
      action: `Prescription Submitted: ${source.facility || 'Hospital'}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Patient uploaded ${source.medicationCount} medication(s) from ${source.facility}. Ready for doctor reconciliation.`,
      type: 'source_ingested'
    };
    setActivities(prev => [newAct, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Patient Record Uploaded',
      message: `${targetPatient?.name} submitted records from ${source.facility || 'Hospital'}. Review needed.`,
      timestamp: 'Just now',
      read: false,
      priority: 'high',
      patientId,
      type: 'discrepancy'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updatePatientSubmittedSource = (patientId: string, updatedSource: MedicationSource) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        sources: p.sources.map(s => s.id === updatedSource.id ? updatedSource : s),
        lastUpdated: 'Just now'
      };
    }));

    const targetPatient = patients.find(p => p.id === patientId);
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId,
      patientName: targetPatient?.name || 'Patient',
      clinicianName: 'Patient Portal',
      action: `Prescription Updated: ${updatedSource.facility || 'Hospital'}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Patient modified prescription details (${updatedSource.medications.length} medication(s)).`,
      type: 'source_ingested'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const deletePatientSubmittedSource = (patientId: string, sourceId: string) => {
    let deletedFacility = 'Prescription Record';
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const targetSource = p.sources.find(s => s.id === sourceId);
      if (targetSource?.facility) deletedFacility = targetSource.facility;
      return {
        ...p,
        sources: p.sources.filter(s => s.id !== sourceId),
        lastUpdated: 'Just now'
      };
    }));

    const targetPatient = patients.find(p => p.id === patientId);
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId,
      patientName: targetPatient?.name || 'Patient',
      clinicianName: 'Patient Portal',
      action: `Prescription Deleted: ${deletedFacility}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Patient removed prescription record from ${deletedFacility}.`,
      type: 'source_removed'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const registerNewPatient = (
    name: string, 
    age: number, 
    gender: 'Male' | 'Female' | 'Other', 
    allergies: string[], 
    primaryHospital: string,
    email: string,
    password?: string
  ): string => {
    const newId = `p-${Date.now().toString().slice(-5)}`;
    const newPatientId = `P-${Math.floor(10000 + Math.random() * 90000)}`;
    const normalizedEmail = email.trim().toLowerCase();

    const newPatient: Patient = {
      id: newId,
      patientId: newPatientId,
      name,
      email: normalizedEmail,
      password: password || 'patient123',
      age,
      gender,
      encounter: 'Hospital Admission',
      admissionDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      attendingPhysician: (currentUser && currentUser.userType === 'doctor' && currentUser.name) 
        ? currentUser.name 
        : (patients[0]?.attendingPhysician || 'Dr. Ananya Sharma, MD'),
      allergies: allergies.length > 0 ? allergies : ['None documented'],
      reconciliationStatus: 'Needs Review',
      priority: 'Medium',
      lastUpdated: 'Just now',
      sources: [
        {
          id: `src-${Date.now()}`,
          type: 'Patient Medication Record',
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          medicationCount: 0,
          status: 'Processed',
          facility: primaryHospital || 'Intake Portal',
          medications: []
        }
      ],
      discrepancies: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: 'Just now',
          title: 'Patient Registered in Portal',
          description: `Account registered via ReconRx Patient Portal (${normalizedEmail}). Awaiting clinical reconciliation.`,
          type: 'admission',
          author: name
        }
      ]
    };

    setPatients(prev => {
      const updated = [newPatient, ...prev];
      localStorage.setItem('reconrx_patients', JSON.stringify(updated));
      return updated;
    });
    setSelectedPatientIdState(newId);

    const patientUser: UserProfile = {
      id: `usr-${newId}`,
      name,
      userType: 'patient',
      role: 'Patient',
      patientId: newId,
      email: normalizedEmail,
      isDemo: false
    };
    setCurrentUser(patientUser);
    sessionStorage.setItem('reconrx_user', JSON.stringify(patientUser));

    return newId;
  };

  const loginAsPatient = (identifier: string = 'ravi.kumar@patient-portal.in', password?: string): { success: boolean; message?: string } => {
    const term = identifier.trim().toLowerCase();
    
    // Look up by email, patientId (e.g. P-10291), or id (p-10291)
    const targetPatient = patients.find(p => 
      (p.email && p.email.toLowerCase() === term) ||
      p.patientId.toLowerCase() === term ||
      p.id.toLowerCase() === term ||
      p.name.toLowerCase() === term
    );

    if (!targetPatient) {
      if (term.includes('@')) {
        return {
          success: false,
          message: `No account registered with "${identifier}". Please switch to "Register as New Patient" to sign up.`
        };
      }
    }

    const matched = targetPatient || patients[0];
    const patientUser: UserProfile = {
      id: `usr-${matched.id}`,
      name: matched.name,
      userType: 'patient',
      role: 'Patient',
      patientId: matched.id,
      email: matched.email || `${matched.name.toLowerCase().replace(/\s+/g, '.')}@patient-portal.in`,
      avatarUrl: matched.id === 'p-10291' 
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' 
        : undefined,
      isDemo: matched.id === 'p-10291'
    };
    
    setCurrentUser(patientUser);
    sessionStorage.setItem('reconrx_user', JSON.stringify(patientUser));
    setSelectedPatientIdState(matched.id);
    return { success: true };
  };

  const loginAsDoctor = () => {
    setCurrentUser(CURRENT_USER);
  };

  return (
    <ReconciliationContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        patients,
        selectedPatient,
        setSelectedPatientId,
        resolveDiscrepancy,
        finalizeReconciliation,
        runReconciliation,
        resetToDemo,
        activities,
        notifications,
        markNotificationRead,
        searchQuery,
        setSearchQuery,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        activeDiscrepancyForAi,
        setActiveDiscrepancyForAi,
        addPatientSubmittedSource,
        updatePatientSubmittedSource,
        deletePatientSubmittedSource,
        registerNewPatient,
        loginAsPatient,
        loginAsDoctor,
        quickVerifyDiscrepancy,
        verifyAllRemaining
      }}
    >
      {children}
    </ReconciliationContext.Provider>
  );
};

export const useReconciliation = () => {
  const context = useContext(ReconciliationContext);
  if (!context) {
    throw new Error('useReconciliation must be used within a ReconciliationProvider');
  }
  return context;
};
