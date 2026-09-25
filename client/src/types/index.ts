export type DiscrepancyType = 
  | 'DOSE_CHANGE'
  | 'FREQUENCY_CHANGE'
  | 'DOSE_FREQUENCY_CHANGE'
  | 'ROUTE_CHANGE'
  | 'POTENTIAL_OMISSION'
  | 'NEW_MEDICATION'
  | 'POSSIBLE_DUPLICATE'
  | 'UNCHANGED'
  | 'DRUG_DRUG_INTERACTION'
  | 'ALLERGY_CONTRAINDICATION';

export type DiscrepancyStatus = 'REQUIRES_REVIEW' | 'REVIEWED' | 'DISMISSED';

export type SeverityLevel = 'Critical' | 'Major' | 'Moderate' | 'Minor' | 'Info';

export type ResolutionAction = 
  | 'CONFIRM_CHANGE'
  | 'REVERT_PREVIOUS'
  | 'CONFIRM_DISCONTINUED'
  | 'ADD_TO_CURRENT'
  | 'CONFIRM_DUPLICATE'
  | 'KEEP_BOTH'
  | 'SUBSTITUTE_ALTERNATIVE'
  | 'MARK_FURTHER_REVIEW'
  | 'VERIFIED_CORRECT';

export interface MedicationItem {
  id: string;
  name: string;
  genericName?: string;
  dose: string;
  unit?: string;
  frequency: string;
  route: string;
  indication?: string;
  source: 'Previous Prescription' | 'Patient Medication Record' | 'Current Hospital Record';
  prescribedDate?: string;
  prescribingDoctor?: string;
  status: 'Active' | 'Discontinued' | 'Suspended' | 'Under Review';
}

export interface DrugDrugInteractionRule {
  interaction_id: number;
  drug_a: string;
  drug_b: string;
  severity: 'Major' | 'Moderate' | 'Minor' | 'Critical';
  mechanism: string;
  clinical_effect: string;
  safer_alternative: string;
  clinical_management: string;
  reference: string;
}

export interface PatientCohortEntry {
  age: number;
  medication_duration: number;
  allergy: string;
  cholesterol: 'HIGH' | 'NORMAL';
  sex: 'M' | 'F';
  bp: 'HIGH' | 'NORMAL' | 'LOW';
  na_to_k: number;
  drug: string;
}

export interface DiscrepancyItem {
  id: string;
  medicationName: string;
  genericName?: string;
  type: DiscrepancyType;
  severity: SeverityLevel;
  status: DiscrepancyStatus;
  previousRecord: {
    dose?: string;
    frequency?: string;
    route?: string;
    sourceDate?: string;
    sourceName?: string;
  } | null;
  currentRecord: {
    dose?: string;
    frequency?: string;
    route?: string;
    orderDate?: string;
    prescriber?: string;
  } | null;
  aiObservation: string;
  clinicalExplanation: string;
  suggestedAction: string;
  ddiDetails?: DrugDrugInteractionRule;
  allergyConflict?: string;
  resolution?: {
    action: ResolutionAction;
    rationale: string;
    reviewedBy: string;
    timestamp: string;
  };
}

export interface MedicationSource {
  id: string;
  type: 'Previous Prescription' | 'Patient Medication Record' | 'Current Hospital Record';
  date: string;
  medicationCount: number;
  status: 'Processed' | 'Pending' | 'Needs Ingestion';
  documentName?: string;
  facility?: string;
  medications: MedicationItem[];
}

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  email?: string;
  password?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  encounter: 'Hospital Admission' | 'Transfer' | 'Discharge' | 'Referral';
  admissionDate: string;
  room?: string;
  attendingPhysician: string;
  allergies: string[];
  vitalSigns?: {
    bp: string;
    heartRate: number;
    cholesterol: 'HIGH' | 'NORMAL';
    naToKRatio: number;
  };
  reconciliationStatus: 'Needs Review' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  lastUpdated: string;
  sources: MedicationSource[];
  discrepancies: DiscrepancyItem[];
  timeline: {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'prescription' | 'admission' | 'reconciliation' | 'review' | 'update';
    author?: string;
  }[];
  finalizedAt?: string;
  finalizedBy?: string;
  finalReport?: FinalReconciledReport;
}

export interface FinalReconciledReport {
  id: string;
  generatedAt: string;
  signedBy: string;
  patientId: string;
  patientName: string;
  summary: string;
  totalPrescriptionsReviewed: number;
  reviewedSources: Array<{
    facility: string;
    date: string;
    type: string;
    medicationCount: number;
  }>;
  reconciledMedications: Array<{
    name: string;
    dose: string;
    frequency: string;
    route: string;
    action: string;
    rationale: string;
    status: 'Active' | 'Discontinued' | 'Modified' | 'Held';
    prescribingDoctor?: string;
    originFacility?: string;
    verifiedByDoctor?: boolean;
  }>;
  unverifiedMedications?: Array<{
    name: string;
    dose?: string;
    frequency?: string;
    reason?: string;
  }>;
  omittedMedications?: Array<{
    name: string;
    dose?: string;
    frequency?: string;
    reason?: string;
  }>;
  safetyCheckSummary: {
    ddiCount: number;
    allergyAlertsCount: number;
    omissionsResolvedCount: number;
    safetyStatus: 'Verified Safe' | 'Caution Advised';
  };
  doctorInstructions: string;
}

export interface UserProfile {
  id: string;
  name: string;
  userType: 'doctor' | 'patient';
  role: 'Doctor' | 'Doctor / Healthcare Professional' | 'Healthcare Professional' | 'Chief Pharmacist' | 'Clinical Reviewer' | 'Patient';
  department?: string;
  patientId?: string; // Associated patient ID if userType === 'patient'
  avatarUrl?: string;
  email: string;
  isDemo: boolean;
}

export interface ActivityLog {
  id: string;
  patientId: string;
  patientName: string;
  clinicianName: string;
  action: string;
  timestamp: string;
  details: string;
  type: 'resolution' | 'reconciliation' | 'finalization' | 'source_ingested' | 'source_removed';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  patientId: string;
  type: 'discrepancy' | 'finalized' | 'admission';
}
