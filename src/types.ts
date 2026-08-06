export type PatientStatus = 'stable' | 'warning' | 'critical';

export interface VitalSigns {
  spo2: number;        // Oxygen Saturation (%)
  heartRate: number;   // Heart Rate (bpm)
  map: number;         // Mean Arterial Pressure (mmHg)
  respRate: number;    // Respiratory Rate (breaths/min)
  temp: number;        // Temperature (°C)
  age: number;         // Age (years)
  wbc: number;         // White Blood Cell count (x10^3/µL)
  lactate: number;     // Blood Lactate (mmol/L)
}

export interface TrajectoryPoint {
  timeLabel: string;
  riskPercentage: number;
  spo2: number;
  map: number;
  heartRate: number;
}

export interface SHAPFeature {
  feature: string;
  displayName: string;
  valueLabel: string;
  impact: number; // positive = risk increasing, negative = protective
  unit: string;
  baselineValue: number;
  currentValue: number;
  description: string;
}

export interface LIMELocalExplanation {
  feature: string;
  displayName: string;
  valueLabel: string;
  weight: number;
  type: 'risk_increasing' | 'protective';
  ruleDescription: string;
}

export interface ClinicalAction {
  id: string;
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'moderate' | 'routine';
  protocolReference: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Patient {
  id: string;
  bedNumber: string;
  name: string;
  patientCode: string;
  age: number;
  gender: 'M' | 'F';
  admissionDiagnosis: string;
  status: PatientStatus;
  vitals: VitalSigns;
  trajectory: TrajectoryPoint[];
  currentRisk: number;
  riskNarrative: string;
  lastModelUpdate: string;
  confidenceScore: number;
  shapFeatures: SHAPFeature[];
  limeExplanations: LIMELocalExplanation[];
  recommendedActions: ClinicalAction[];
  emrNotes: string;
}

export interface SimulationResult {
  simulatedRisk: number;
  riskDifference: number; // e.g. +15 or -10
  mortalityImpactText: string;
  shapChanges: { feature: string; newImpact: number }[];
  updatedNarrative: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  references?: string[];
  suggestedPrompts?: string[];
}

export type ViewTab = 'risk-analysis' | 'clinical-view' | 'history';

export type UserRole = 'nurse' | 'doctor' | 'lead';

export interface ClinicalUser {
  id: string;
  name: string;
  staffId: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  shift?: string;
  avatarInitials?: string;
}
