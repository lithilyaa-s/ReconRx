import { Patient, UserProfile, ActivityLog, NotificationItem } from '../types';
import { DDI_DATABASE } from './ddiDatabase';

export const CURRENT_USER: UserProfile = {
  id: 'usr-001',
  name: 'Dr. Ananya Sharma',
  userType: 'doctor',
  role: 'Doctor / Healthcare Professional',
  department: 'Inpatient Clinical Pharmacy & Transitions of Care',
  email: 'ananya.sharma@reconrx-health.internal',
  avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
  isDemo: true,
};

export const DEMO_PATIENT_USER: UserProfile = {
  id: 'usr-pat-001',
  name: 'Ravi Kumar',
  userType: 'patient',
  role: 'Patient',
  patientId: 'p-10291',
  email: 'ravi.kumar@patient-portal.in',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  isDemo: true,
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-10291',
    patientId: 'P-10291',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@patient-portal.in',
    age: 58,
    gender: 'Male',
    encounter: 'Hospital Admission',
    admissionDate: 'September 25, 2026',
    room: 'Ward 4B - Bed 12',
    attendingPhysician: 'Dr. Ananya Sharma, MD',
    allergies: ['Penicillin (Moderate rash)', 'Shellfish'],
    vitalSigns: {
      bp: '138/86 mmHg',
      heartRate: 74,
      cholesterol: 'HIGH',
      naToKRatio: 16.4
    },
    reconciliationStatus: 'Needs Review',
    priority: 'High',
    lastUpdated: '2 hours ago',
    sources: [
      {
        id: 'src-1',
        type: 'Previous Prescription',
        date: 'September 22, 2026',
        medicationCount: 3,
        status: 'Processed',
        documentName: 'Outpatient_Rx_St_Jude_Clinic.pdf',
        facility: 'St. Jude Community Health Center',
        medications: [
          {
            id: 'med-prev-1',
            name: 'Metformin',
            genericName: 'Metformin Hydrochloride',
            dose: '500 mg',
            unit: 'mg',
            frequency: 'Twice daily',
            route: 'Oral',
            indication: 'Type 2 Diabetes Mellitus',
            source: 'Previous Prescription',
            prescribedDate: 'September 22, 2026',
            prescribingDoctor: 'Dr. K. V. Iyer',
            status: 'Active'
          },
          {
            id: 'med-prev-2',
            name: 'Amlodipine',
            genericName: 'Amlodipine Besylate',
            dose: '5 mg',
            unit: 'mg',
            frequency: 'Once daily',
            route: 'Oral',
            indication: 'Essential Hypertension',
            source: 'Previous Prescription',
            prescribedDate: 'September 22, 2026',
            prescribingDoctor: 'Dr. K. V. Iyer',
            status: 'Active'
          },
          {
            id: 'med-prev-3',
            name: 'Atorvastatin',
            genericName: 'Atorvastatin Calcium',
            dose: '20 mg',
            unit: 'mg',
            frequency: 'Once daily',
            route: 'Oral',
            indication: 'Hyperlipidemia / Atherosclerosis prophylaxis',
            source: 'Previous Prescription',
            prescribedDate: 'September 22, 2026',
            prescribingDoctor: 'Dr. K. V. Iyer',
            status: 'Active'
          }
        ]
      },
      {
        id: 'src-2',
        type: 'Patient Medication Record',
        date: 'September 24, 2026',
        medicationCount: 3,
        status: 'Processed',
        documentName: 'Patient_Portal_SelfReport.json',
        facility: 'Apollo Patient Health Portal',
        medications: [
          {
            id: 'med-self-1',
            name: 'Metformin',
            dose: '500 mg',
            frequency: 'Twice daily with meals',
            route: 'Oral',
            source: 'Patient Medication Record',
            status: 'Active'
          },
          {
            id: 'med-self-2',
            name: 'Amlodipine',
            dose: '5 mg',
            frequency: 'Morning',
            route: 'Oral',
            source: 'Patient Medication Record',
            status: 'Active'
          },
          {
            id: 'med-self-3',
            name: 'Atorvastatin',
            dose: '20 mg',
            frequency: 'Night before bedtime',
            route: 'Oral',
            source: 'Patient Medication Record',
            status: 'Active'
          }
        ]
      },
      {
        id: 'src-3',
        type: 'Current Hospital Record',
        date: 'September 25, 2026',
        medicationCount: 3,
        status: 'Processed',
        documentName: 'Admission_Physician_Order_Sheet.pdf',
        facility: 'Metropolitan General Hospital',
        medications: [
          {
            id: 'med-curr-1',
            name: 'Metformin',
            genericName: 'Metformin Hydrochloride',
            dose: '1000 mg',
            unit: 'mg',
            frequency: 'Once daily',
            route: 'Oral',
            indication: 'Type 2 Diabetes Mellitus',
            source: 'Current Hospital Record',
            prescribedDate: 'September 25, 2026',
            prescribingDoctor: 'Dr. Rajesh Deshmukh',
            status: 'Active'
          },
          {
            id: 'med-curr-2',
            name: 'Amlodipine',
            genericName: 'Amlodipine Besylate',
            dose: '5 mg',
            unit: 'mg',
            frequency: 'Once daily',
            route: 'Oral',
            indication: 'Hypertension',
            source: 'Current Hospital Record',
            prescribedDate: 'September 25, 2026',
            prescribingDoctor: 'Dr. Rajesh Deshmukh',
            status: 'Active'
          },
          {
            id: 'med-curr-3',
            name: 'Aspirin',
            genericName: 'Acetylsalicylic Acid',
            dose: '75 mg',
            unit: 'mg',
            frequency: 'Once daily',
            route: 'Oral',
            indication: 'Cardiovascular secondary prevention',
            source: 'Current Hospital Record',
            prescribedDate: 'September 25, 2026',
            prescribingDoctor: 'Dr. Rajesh Deshmukh',
            status: 'Active'
          }
        ]
      }
    ],
    discrepancies: [
      {
        id: 'disc-1',
        medicationName: 'Atorvastatin 20 mg',
        genericName: 'Atorvastatin Calcium',
        type: 'POTENTIAL_OMISSION',
        severity: 'Critical',
        status: 'REQUIRES_REVIEW',
        previousRecord: {
          dose: '20 mg',
          frequency: 'Once daily (Night)',
          route: 'Oral',
          sourceDate: 'September 22, 2026',
          sourceName: 'Outpatient Clinic Rx'
        },
        currentRecord: null,
        aiObservation: 'Medication appears in the outpatient prescription and patient self-report, but is completely absent from the current hospital admission medication orders.',
        clinicalExplanation: 'Potential unintended omission of essential chronic lipid-lowering therapy in a patient admitted with cardiovascular comorbidities. Abrupt statin discontinuation may cause rebound endothelial inflammation.',
        suggestedAction: 'Verify whether Atorvastatin 20 mg was intentionally held (e.g. pending liver function tests) or inadvertently omitted during admission order entry.'
      },
      {
        id: 'disc-2',
        medicationName: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        type: 'DOSE_FREQUENCY_CHANGE',
        severity: 'Major',
        status: 'REQUIRES_REVIEW',
        previousRecord: {
          dose: '500 mg',
          frequency: 'Twice daily',
          route: 'Oral',
          sourceDate: 'September 22, 2026',
          sourceName: 'Outpatient Clinic Rx'
        },
        currentRecord: {
          dose: '1000 mg',
          frequency: 'Once daily',
          route: 'Oral',
          orderDate: 'September 25, 2026',
          prescriber: 'Dr. Rajesh Deshmukh'
        },
        aiObservation: 'The dosage has increased from 500 mg to 1000 mg, and frequency shifted from twice daily to once daily.',
        clinicalExplanation: 'While total daily dose remains 1000 mg/day, shifting immediate-release Metformin from 500 mg BID to 1000 mg QD can elevate gastrointestinal intolerance risk unless an extended-release (ER/XR) formulation is specified.',
        suggestedAction: 'Confirm whether 1000 mg once daily was intentional, and verify if the formulation should be specified as Metformin Extended-Release (XR).'
      },
      {
        id: 'disc-3',
        medicationName: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        type: 'NEW_MEDICATION',
        severity: 'Moderate',
        status: 'REQUIRES_REVIEW',
        previousRecord: null,
        currentRecord: {
          dose: '75 mg',
          frequency: 'Once daily',
          route: 'Oral',
          orderDate: 'September 25, 2026',
          prescriber: 'Dr. Rajesh Deshmukh'
        },
        aiObservation: 'Medication not present in prior outpatient history. Initiated de novo upon hospital admission.',
        clinicalExplanation: 'Antiplatelet therapy initiated for newly diagnosed coronary risk or secondary prophylaxis. Confirm patient has no active gastrointestinal bleeding or ulcer history.',
        suggestedAction: 'Confirm indication with inpatient cardiology order and verify patient tolerability.'
      },
      {
        id: 'disc-4',
        medicationName: 'Amlodipine',
        genericName: 'Amlodipine Besylate',
        type: 'UNCHANGED',
        severity: 'Info',
        status: 'REVIEWED',
        previousRecord: {
          dose: '5 mg',
          frequency: 'Once daily',
          route: 'Oral',
          sourceDate: 'September 22, 2026',
          sourceName: 'Outpatient Clinic Rx'
        },
        currentRecord: {
          dose: '5 mg',
          frequency: 'Once daily',
          route: 'Oral',
          orderDate: 'September 25, 2026',
          prescriber: 'Dr. Rajesh Deshmukh'
        },
        aiObservation: 'Dosage, route, and frequency match identically between outpatient and inpatient records.',
        clinicalExplanation: 'Regimen verified concordant across all transitions of care.',
        suggestedAction: 'No clinician action needed. Regimen confirmed.',
        resolution: {
          action: 'VERIFIED_CORRECT',
          rationale: 'Dosage and frequency identical between outpatient records and admission orders.',
          reviewedBy: 'Dr. Ananya Sharma',
          timestamp: 'September 25, 2026, 21:15'
        }
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        date: 'September 20, 2026',
        title: 'Primary Care Visit',
        description: 'Routine chronic disease follow-up with Dr. K. V. Iyer.',
        type: 'prescription',
        author: 'Dr. K. V. Iyer'
      },
      {
        id: 'tl-2',
        date: 'September 22, 2026',
        title: 'Previous Prescription Issued',
        description: 'Rx issued for Metformin 500mg BID, Amlodipine 5mg QD, Atorvastatin 20mg QD.',
        type: 'prescription',
        author: 'St. Jude Pharmacy'
      },
      {
        id: 'tl-3',
        date: 'September 24, 2026',
        title: 'Patient Medication Update',
        description: 'Patient confirmed adherence via Apollo mobile portal.',
        type: 'update',
        author: 'Patient (Self-Report)'
      },
      {
        id: 'tl-4',
        date: 'September 25, 2026 — 14:30',
        title: 'Hospital Admission',
        description: 'Admitted under Cardiology service for acute chest tightness and dyspnea evaluation.',
        type: 'admission',
        author: 'Admissions Desk'
      },
      {
        id: 'tl-5',
        date: 'September 25, 2026 — 16:00',
        title: 'Current Hospital Medication List Ordered',
        description: 'Admission orders entered by Dr. Rajesh Deshmukh.',
        type: 'admission',
        author: 'Dr. Rajesh Deshmukh'
      },
      {
        id: 'tl-6',
        date: 'September 25, 2026 — 17:15',
        title: 'ReconRx AI Analysis Executed',
        description: 'ReconRx ingested 3 sources, normalized 4 entities, and flagged 3 clinical discrepancies.',
        type: 'reconciliation',
        author: 'ReconRx Safety Copilot'
      }
    ]
  },
  {
    id: 'p-10292',
    patientId: 'P-10292',
    name: 'Priya Nair',
    age: 46,
    gender: 'Female',
    encounter: 'Transfer',
    admissionDate: 'September 23, 2026',
    room: 'Step-Down Unit - Bed 04',
    attendingPhysician: 'Dr. Ananya Sharma, MD',
    allergies: ['Sulfa drugs', 'Latex'],
    vitalSigns: {
      bp: '124/78 mmHg',
      heartRate: 68,
      cholesterol: 'NORMAL',
      naToKRatio: 12.8
    },
    reconciliationStatus: 'Completed',
    priority: 'Low',
    lastUpdated: '1 day ago',
    sources: [
      {
        id: 'src-pn-1',
        type: 'Previous Prescription',
        date: 'September 21, 2026',
        medicationCount: 4,
        status: 'Processed',
        medications: [
          { id: 'pn-m1', name: 'Levothyroxine', dose: '100 mcg', frequency: 'Once daily morning', route: 'Oral', source: 'Previous Prescription', status: 'Active' },
          { id: 'pn-m2', name: 'Pantoprazole', dose: '40 mg', frequency: 'Once daily', route: 'Oral', source: 'Previous Prescription', status: 'Active' },
          { id: 'pn-m3', name: 'Salbutamol Inhaler', dose: '100 mcg/puff', frequency: 'As needed', route: 'Inhaled', source: 'Previous Prescription', status: 'Active' }
        ]
      },
      {
        id: 'src-pn-2',
        type: 'Current Hospital Record',
        date: 'September 24, 2026',
        medicationCount: 3,
        status: 'Processed',
        medications: [
          { id: 'pn-m4', name: 'Levothyroxine', dose: '100 mcg', frequency: 'Once daily morning', route: 'Oral', source: 'Current Hospital Record', status: 'Active' },
          { id: 'pn-m5', name: 'Pantoprazole', dose: '40 mg', frequency: 'Once daily', route: 'Oral', source: 'Current Hospital Record', status: 'Active' },
          { id: 'pn-m6', name: 'Salbutamol Inhaler', dose: '100 mcg/puff', frequency: 'As needed', route: 'Inhaled', source: 'Current Hospital Record', status: 'Active' }
        ]
      }
    ],
    discrepancies: [
      {
        id: 'pn-disc-1',
        medicationName: 'Levothyroxine 100 mcg',
        type: 'UNCHANGED',
        severity: 'Info',
        status: 'REVIEWED',
        previousRecord: { dose: '100 mcg', frequency: 'Once daily' },
        currentRecord: { dose: '100 mcg', frequency: 'Once daily' },
        aiObservation: 'Concordant across admission and transfer orders.',
        clinicalExplanation: 'Verified unchanged.',
        suggestedAction: 'No action required.',
        resolution: {
          action: 'VERIFIED_CORRECT',
          rationale: 'Confirmed unchanged across transfer.',
          reviewedBy: 'Dr. Ananya Sharma',
          timestamp: 'September 24, 2026, 11:20'
        }
      }
    ],
    timeline: [
      { id: 'pn-t1', date: 'September 23, 2026', title: 'ICU Transfer', description: 'Transferred to Step-Down unit', type: 'admission' },
      { id: 'pn-t2', date: 'September 24, 2026', title: 'Reconciliation Finalized', description: 'All orders confirmed by clinical pharmacy', type: 'review', author: 'Dr. Ananya Sharma' }
    ],
    finalizedAt: 'September 24, 2026, 11:25',
    finalizedBy: 'Dr. Ananya Sharma'
  },
  {
    id: 'p-10293',
    patientId: 'P-10293',
    name: 'Marcus Vance',
    age: 69,
    gender: 'Male',
    encounter: 'Hospital Admission',
    admissionDate: 'September 25, 2026',
    room: 'Orthopedics - Bed 08',
    attendingPhysician: 'Dr. Ananya Sharma, MD',
    allergies: ['Codeine', 'Morphine'],
    vitalSigns: {
      bp: '142/88 mmHg',
      heartRate: 82,
      cholesterol: 'HIGH',
      naToKRatio: 18.2
    },
    reconciliationStatus: 'Needs Review',
    priority: 'High',
    lastUpdated: '3 hours ago',
    sources: [
      {
        id: 'src-mv-1',
        type: 'Previous Prescription',
        date: 'September 20, 2026',
        medicationCount: 2,
        status: 'Processed',
        medications: [
          { id: 'mv-m1', name: 'Warfarin', genericName: 'Warfarin Sodium', dose: '5 mg', frequency: 'Once daily at evening', route: 'Oral', source: 'Previous Prescription', status: 'Active' }
        ]
      },
      {
        id: 'src-mv-2',
        type: 'Current Hospital Record',
        date: 'September 25, 2026',
        medicationCount: 2,
        status: 'Processed',
        medications: [
          { id: 'mv-m2', name: 'Warfarin', dose: '5 mg', frequency: 'Once daily at evening', route: 'Oral', source: 'Current Hospital Record', status: 'Active' },
          { id: 'mv-m3', name: 'Ibuprofen', dose: '400 mg', frequency: 'Three times daily PRN for knee pain', route: 'Oral', source: 'Current Hospital Record', status: 'Active' }
        ]
      }
    ],
    discrepancies: [
      {
        id: 'mv-disc-1',
        medicationName: 'Warfarin + Ibuprofen Co-administration',
        type: 'DRUG_DRUG_INTERACTION',
        severity: 'Critical',
        status: 'REQUIRES_REVIEW',
        previousRecord: { dose: 'Warfarin 5 mg', frequency: 'Once daily' },
        currentRecord: { dose: 'Ibuprofen 400 mg', frequency: 'TID PRN' },
        aiObservation: 'Critical Drug-Drug Interaction identified by ReconRx safety database (Rule ID: #1).',
        clinicalExplanation: DDI_DATABASE[0].clinical_effect,
        suggestedAction: DDI_DATABASE[0].clinical_management,
        ddiDetails: DDI_DATABASE[0]
      }
    ],
    timeline: [
      { id: 'mv-t1', date: 'September 25, 2026', title: 'Admitted for Orthopedic Evaluation', description: 'Patient reports severe knee pain.', type: 'admission' },
      { id: 'mv-t2', date: 'September 25, 2026', title: 'Critical DDI Alert Triggered', description: 'Warfarin + Ibuprofen flagged by ReconRx.', type: 'reconciliation' }
    ]
  },
  {
    id: 'p-10294',
    patientId: 'P-10294',
    name: 'David Chen',
    age: 62,
    gender: 'Male',
    encounter: 'Discharge',
    admissionDate: 'September 21, 2026',
    room: 'Cardiology 2A - Bed 15',
    attendingPhysician: 'Dr. Ananya Sharma, MD',
    allergies: ['None known'],
    vitalSigns: {
      bp: '128/80 mmHg',
      heartRate: 70,
      cholesterol: 'NORMAL',
      naToKRatio: 14.2
    },
    reconciliationStatus: 'In Progress',
    priority: 'Medium',
    lastUpdated: '4 hours ago',
    sources: [
      {
        id: 'src-dc-1',
        type: 'Previous Prescription',
        date: 'September 18, 2026',
        medicationCount: 2,
        status: 'Processed',
        medications: [
          { id: 'dc-m1', name: 'Clopidogrel', dose: '75 mg', frequency: 'Once daily', route: 'Oral', source: 'Previous Prescription', status: 'Active' }
        ]
      },
      {
        id: 'src-dc-2',
        type: 'Current Hospital Record',
        date: 'September 25, 2026',
        medicationCount: 2,
        status: 'Processed',
        medications: [
          { id: 'dc-m2', name: 'Clopidogrel', dose: '75 mg', frequency: 'Once daily', route: 'Oral', source: 'Current Hospital Record', status: 'Active' },
          { id: 'dc-m3', name: 'Omeprazole', dose: '20 mg', frequency: 'Once daily', route: 'Oral', source: 'Current Hospital Record', status: 'Active' }
        ]
      }
    ],
    discrepancies: [
      {
        id: 'dc-disc-1',
        medicationName: 'Clopidogrel + Omeprazole Co-administration',
        type: 'DRUG_DRUG_INTERACTION',
        severity: 'Major',
        status: 'REQUIRES_REVIEW',
        previousRecord: { dose: 'Clopidogrel 75 mg', frequency: 'Once daily' },
        currentRecord: { dose: 'Omeprazole 20 mg', frequency: 'Once daily' },
        aiObservation: 'Moderate/Major DDI identified (Rule ID: #4): Omeprazole inhibits CYP2C19 activation of Clopidogrel.',
        clinicalExplanation: DDI_DATABASE[3].clinical_effect,
        suggestedAction: DDI_DATABASE[3].clinical_management,
        ddiDetails: DDI_DATABASE[3]
      }
    ],
    timeline: [
      { id: 'dc-t1', date: 'September 21, 2026', title: 'Post-PCI Stent Care', description: 'Patient received drug-eluting stent.', type: 'admission' }
    ]
  },
  {
    id: 'p-10295',
    patientId: 'P-10295',
    name: 'Sarah Jenkins',
    age: 72,
    gender: 'Female',
    encounter: 'Referral',
    admissionDate: 'September 24, 2026',
    room: 'Nephrology Suite 3',
    attendingPhysician: 'Dr. Ananya Sharma, MD',
    allergies: ['Aspirin (Bronchospasm)', 'Ibuprofen'],
    vitalSigns: {
      bp: '150/92 mmHg',
      heartRate: 76,
      cholesterol: 'HIGH',
      naToKRatio: 22.4
    },
    reconciliationStatus: 'Needs Review',
    priority: 'High',
    lastUpdated: '5 hours ago',
    sources: [
      {
        id: 'src-sj-1',
        type: 'Previous Prescription',
        date: 'September 15, 2026',
        medicationCount: 2,
        status: 'Processed',
        medications: [
          { id: 'sj-m1', name: 'Spironolactone', dose: '25 mg', frequency: 'Once daily', route: 'Oral', source: 'Previous Prescription', status: 'Active' }
        ]
      },
      {
        id: 'src-sj-2',
        type: 'Current Hospital Record',
        date: 'September 24, 2026',
        medicationCount: 2,
        status: 'Processed',
        medications: [
          { id: 'sj-m2', name: 'Spironolactone', dose: '25 mg', frequency: 'Once daily', route: 'Oral', source: 'Current Hospital Record', status: 'Active' },
          { id: 'sj-m3', name: 'Potassium Supplement', dose: '20 mEq', frequency: 'Once daily', route: 'Oral', source: 'Current Hospital Record', status: 'Active' }
        ]
      }
    ],
    discrepancies: [
      {
        id: 'sj-disc-1',
        medicationName: 'Spironolactone + Potassium Supplement Co-administration',
        type: 'DRUG_DRUG_INTERACTION',
        severity: 'Critical',
        status: 'REQUIRES_REVIEW',
        previousRecord: { dose: 'Spironolactone 25 mg', frequency: 'Once daily' },
        currentRecord: { dose: 'Potassium Supplement 20 mEq', frequency: 'Once daily' },
        aiObservation: 'Life-threatening Hyperkalemia Risk (DDI Database Rule ID: #6).',
        clinicalExplanation: DDI_DATABASE[5].clinical_effect,
        suggestedAction: DDI_DATABASE[5].clinical_management,
        ddiDetails: DDI_DATABASE[5]
      }
    ],
    timeline: [
      { id: 'sj-t1', date: 'September 24, 2026', title: 'Nephrology Referral Received', description: 'Referred for management of chronic kidney disease stage 3B.', type: 'admission' }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High Priority Discrepancy Flagged',
    message: 'Ravi Kumar (P-10291) has 3 unresolved discrepancies including an omitted statin.',
    timestamp: '15 mins ago',
    read: false,
    priority: 'high',
    patientId: 'p-10291',
    type: 'discrepancy'
  },
  {
    id: 'notif-2',
    title: 'Severe Drug Interaction Alert',
    message: 'Marcus Vance (P-10293): Warfarin + Ibuprofen combination flagged (Major bleeding risk).',
    timestamp: '1 hour ago',
    read: false,
    priority: 'high',
    patientId: 'p-10293',
    type: 'discrepancy'
  },
  {
    id: 'notif-3',
    title: 'Reconciliation Finalized',
    message: 'Priya Nair (P-10292) reconciliation successfully signed off by Dr. Ananya Sharma.',
    timestamp: '3 hours ago',
    read: true,
    priority: 'low',
    patientId: 'p-10292',
    type: 'finalized'
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    patientId: 'p-10291',
    patientName: 'Ravi Kumar',
    clinicianName: 'Dr. Ananya Sharma',
    action: 'AI Reconciliation Executed',
    timestamp: 'September 25, 2026, 17:15',
    details: 'Normalized 4 active medications and identified 3 care transition discrepancies.',
    type: 'reconciliation'
  },
  {
    id: 'act-2',
    patientId: 'p-10292',
    patientName: 'Priya Nair',
    clinicianName: 'Dr. Ananya Sharma',
    action: 'Medication Order Finalized',
    timestamp: 'September 24, 2026, 11:25',
    details: 'Verified transfer medication list without discrepancies.',
    type: 'finalization'
  },
  {
    id: 'act-3',
    patientId: 'p-10293',
    patientName: 'Marcus Vance',
    clinicianName: 'ReconRx Copilot',
    action: 'Critical DDI Alert Emitted',
    timestamp: 'September 25, 2026, 14:10',
    details: 'Detected co-prescription of Warfarin and Ibuprofen (DrugBank Rule #1).',
    type: 'reconciliation'
  }
];
