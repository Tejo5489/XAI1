import { Patient } from '../types';
import {
  calculateRandomForestRisk,
  calculateSHAPValues,
  calculateLIMEExplanations,
  generateRiskNarrative,
} from '../utils/rfEngine';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: '421A',
    bedNumber: 'B01',
    name: 'DOE, JONATHAN',
    patientCode: 'PATIENT_421A',
    age: 78,
    gender: 'M',
    admissionDiagnosis: 'Acute Exacerbation COPD & Sepsis Evaluation',
    status: 'warning',
    vitals: {
      spo2: 88,
      heartRate: 104,
      map: 82,
      respRate: 24,
      temp: 38.2,
      age: 78,
      wbc: 13.4,
      lactate: 2.1,
    },
    trajectory: [
      { timeLabel: '-6h', riskPercentage: 28, spo2: 95, map: 88, heartRate: 82 },
      { timeLabel: '-4h', riskPercentage: 42, spo2: 93, map: 86, heartRate: 90 },
      { timeLabel: '-2h', riskPercentage: 38, spo2: 91, map: 84, heartRate: 96 },
      { timeLabel: 'Now', riskPercentage: 82, spo2: 88, map: 82, heartRate: 104 },
    ],
    currentRisk: 82,
    riskNarrative:
      'Patient model indicates an 82% probability of critical decompensation within the next 4 hours. The primary driver is a sustained decrease in SpO2 (currently 88%) coupled with advanced Age (78y). Recent upward trends in Heart Rate are compounding the risk score. Current MAP levels provide minimal protective effect. Immediate respiratory assessment is strongly advised.',
    lastModelUpdate: '1m ago',
    confidenceScore: 94,
    shapFeatures: [],
    limeExplanations: [],
    recommendedActions: [
      {
        id: 'rec-1',
        title: 'Titrate Oxygen Therapy',
        description: 'Increase nasal cannula to high-flow non-rebreather mask to target SpO2 >= 92%.',
        urgency: 'critical',
        protocolReference: 'ICU-RESP-04',
        status: 'pending',
      },
      {
        id: 'rec-2',
        title: 'Stat Arterial Blood Gas (ABG)',
        description: 'Assess PaO2/FiO2 ratio, PaCO2 retention, and acute respiratory acidosis.',
        urgency: 'high',
        protocolReference: 'LAB-ABG-01',
        status: 'pending',
      },
      {
        id: 'rec-3',
        title: 'Fluid Challenge & Lactate Re-check',
        description: 'Administer 500mL crystalloid bolus over 30 mins and repeat blood lactate in 2 hours.',
        urgency: 'moderate',
        protocolReference: 'SEP-FLUID-02',
        status: 'pending',
      },
    ],
    emrNotes:
      '78-year-old male with severe COPD admitted 18 hours ago. Telemetry shows progressive desaturation from 95% down to 88%. Patient exhibits mild accessory muscle usage.',
  },
  {
    id: '882C',
    bedNumber: 'B02',
    name: 'SMITH, MARGARET',
    patientCode: 'PATIENT_882C',
    age: 82,
    gender: 'F',
    admissionDiagnosis: 'Cardiogenic Shock & Acute Decompensated Heart Failure',
    status: 'critical',
    vitals: {
      spo2: 84,
      heartRate: 118,
      map: 58,
      respRate: 28,
      temp: 36.4,
      age: 82,
      wbc: 15.8,
      lactate: 3.6,
    },
    trajectory: [
      { timeLabel: '-6h', riskPercentage: 55, spo2: 90, map: 70, heartRate: 98 },
      { timeLabel: '-4h', riskPercentage: 68, spo2: 88, map: 64, heartRate: 106 },
      { timeLabel: '-2h', riskPercentage: 81, spo2: 86, map: 60, heartRate: 112 },
      { timeLabel: 'Now', riskPercentage: 94, spo2: 84, map: 58, heartRate: 118 },
    ],
    currentRisk: 94,
    riskNarrative:
      'Critical decompensation risk at 94%. Severe hypotension (MAP 58 mmHg) combined with profound hypoxia (SpO2 84%) and hyperlactatemia (3.6 mmol/L) indicates impending multi-organ hypoperfusion.',
    lastModelUpdate: 'Just now',
    confidenceScore: 97,
    shapFeatures: [],
    limeExplanations: [],
    recommendedActions: [
      {
        id: 'rec-10',
        title: 'Initiate Vasopressor Infusion',
        description: 'Start Norepinephrine at 0.05 mcg/kg/min to maintain MAP > 65 mmHg.',
        urgency: 'critical',
        protocolReference: 'ICU-VASO-01',
        status: 'pending',
      },
      {
        id: 'rec-11',
        title: 'Urgent Cardiology Consultation',
        description: 'Evaluate for bed-side echocardiogram and intra-aortic balloon pump.',
        urgency: 'critical',
        protocolReference: 'CARD-SHOCK-09',
        status: 'pending',
      },
    ],
    emrNotes:
      '82yo female in cardiogenic shock. Cold peripheries, oliguria (< 20 mL/hr). Rapid response team alerted.',
  },
  {
    id: '104F',
    bedNumber: 'B03',
    name: 'CHEN, ROBERT',
    patientCode: 'PATIENT_104F',
    age: 48,
    gender: 'M',
    admissionDiagnosis: 'Post-Op Laparoscopic Cholecystectomy',
    status: 'stable',
    vitals: {
      spo2: 98,
      heartRate: 72,
      map: 90,
      respRate: 15,
      temp: 36.9,
      age: 48,
      wbc: 6.8,
      lactate: 1.0,
    },
    trajectory: [
      { timeLabel: '-6h', riskPercentage: 12, spo2: 98, map: 92, heartRate: 70 },
      { timeLabel: '-4h', riskPercentage: 10, spo2: 98, map: 91, heartRate: 72 },
      { timeLabel: '-2h', riskPercentage: 11, spo2: 97, map: 89, heartRate: 71 },
      { timeLabel: 'Now', riskPercentage: 9, spo2: 98, map: 90, heartRate: 72 },
    ],
    currentRisk: 9,
    riskNarrative:
      'Patient exhibits low risk of decompensation (9%). Normal arterial oxygenation (98%) and hemodynamics provide strong protective factors.',
    lastModelUpdate: '3m ago',
    confidenceScore: 96,
    shapFeatures: [],
    limeExplanations: [],
    recommendedActions: [
      {
        id: 'rec-20',
        title: 'Routine Ward Transfer Evaluation',
        description: 'Patient meets criteria for step-down unit transition.',
        urgency: 'routine',
        protocolReference: 'ICU-DISCHARGE-01',
        status: 'pending',
      },
    ],
    emrNotes:
      'Post-op day 1. Pain controlled, tolerating oral fluids. Vitals completely stable.',
  },
  {
    id: '991B',
    bedNumber: 'B04',
    name: 'GARCIA, ELENA',
    patientCode: 'PATIENT_991B',
    age: 63,
    gender: 'F',
    admissionDiagnosis: 'Community Acquired Pneumonia',
    status: 'warning',
    vitals: {
      spo2: 91,
      heartRate: 94,
      map: 76,
      respRate: 22,
      temp: 38.6,
      age: 63,
      wbc: 14.1,
      lactate: 1.9,
    },
    trajectory: [
      { timeLabel: '-6h', riskPercentage: 22, spo2: 95, map: 82, heartRate: 84 },
      { timeLabel: '-4h', riskPercentage: 35, spo2: 93, map: 80, heartRate: 88 },
      { timeLabel: '-2h', riskPercentage: 45, spo2: 92, map: 78, heartRate: 92 },
      { timeLabel: 'Now', riskPercentage: 58, spo2: 91, map: 76, heartRate: 94 },
    ],
    currentRisk: 58,
    riskNarrative:
      'Moderate deterioration risk (58%). Tachypnea (22/min) and inflammatory response (WBC 14.1) driving risk score.',
    lastModelUpdate: '2m ago',
    confidenceScore: 92,
    shapFeatures: [],
    limeExplanations: [],
    recommendedActions: [
      {
        id: 'rec-30',
        title: 'Repeat Chest X-Ray',
        description: 'Evaluate consolidation progression in right lower lobe.',
        urgency: 'moderate',
        protocolReference: 'RAD-CXR-03',
        status: 'pending',
      },
    ],
    emrNotes:
      'Admitted with fever and productive cough. Broad-spectrum antibiotics started 6 hours ago.',
  },
];

// Initialize calculated SHAP and LIME values for all mock patients
export function getPopulatedPatients(): Patient[] {
  return INITIAL_PATIENTS.map((p) => {
    const calculatedRisk = calculateRandomForestRisk(p.vitals);
    const shap = calculateSHAPValues(p.vitals);
    const lime = calculateLIMEExplanations(p.vitals);
    const narrative = generateRiskNarrative(p.vitals, calculatedRisk);

    return {
      ...p,
      currentRisk: calculatedRisk,
      shapFeatures: shap,
      limeExplanations: lime,
      riskNarrative: narrative,
    };
  });
}
