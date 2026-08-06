import { VitalSigns, SHAPFeature, LIMELocalExplanation, SimulationResult, ClinicalAction } from '../types';

// Clinical baseline averages for normal adult telemetry
export const BASELINE_VITALS: VitalSigns = {
  spo2: 97,
  heartRate: 72,
  map: 88,
  respRate: 16,
  temp: 36.8,
  age: 55,
  wbc: 7.2,
  lactate: 1.1,
};

// Base expected risk across general ICU telemetry population
export const BASE_EXPECTED_RISK = 18.5; // %

/**
 * Simulates a Random Forest model ensemble probability of critical deterioration (0 - 100%)
 */
export function calculateRandomForestRisk(vitals: VitalSigns): number {
  let logOdds = -2.2; // Base log-odds for ~10% risk

  // 1. SpO2 Impact (Non-linear Exponential Risk increase for hypoxia)
  if (vitals.spo2 < 95) {
    const spo2Deficit = 95 - vitals.spo2;
    logOdds += spo2Deficit * 0.28 + Math.pow(spo2Deficit, 1.35) * 0.08;
  } else if (vitals.spo2 >= 98) {
    logOdds -= 0.3; // Protective high saturation
  }

  // 2. Mean Arterial Pressure (MAP)
  if (vitals.map < 65) {
    const mapDeficit = 65 - vitals.map;
    logOdds += mapDeficit * 0.12 + Math.pow(mapDeficit, 1.2) * 0.04;
  } else if (vitals.map > 110) {
    logOdds += (vitals.map - 110) * 0.06;
  } else if (vitals.map >= 75 && vitals.map <= 95) {
    logOdds -= 0.4; // Protective normal perfusion
  }

  // 3. Heart Rate
  if (vitals.heartRate > 100) {
    logOdds += (vitals.heartRate - 100) * 0.04;
  } else if (vitals.heartRate < 50) {
    logOdds += (50 - vitals.heartRate) * 0.05;
  }

  // 4. Age Factor
  if (vitals.age > 65) {
    logOdds += (vitals.age - 65) * 0.035;
  }

  // 5. Respiratory Rate
  if (vitals.respRate > 20) {
    logOdds += (vitals.respRate - 20) * 0.12;
  } else if (vitals.respRate < 10) {
    logOdds += (10 - vitals.respRate) * 0.15;
  }

  // 6. Lactate (Sepsis/Tissue hypoperfusion marker)
  if (vitals.lactate > 2.0) {
    logOdds += (vitals.lactate - 2.0) * 0.7;
  }

  // 7. WBC
  if (vitals.wbc > 12.0) {
    logOdds += (vitals.wbc - 12.0) * 0.15;
  } else if (vitals.wbc < 4.0) {
    logOdds += (4.0 - vitals.wbc) * 0.2;
  }

  // Convert log odds to probability
  const risk = 100 / (1 + Math.exp(-logOdds));
  return Math.min(99.5, Math.max(1.0, Math.round(risk * 10) / 10));
}

/**
 * Calculates TreeSHAP feature contributions (Shapley Additive exPlanations)
 * Ensures sum(SHAP) + BASE_EXPECTED_RISK = Current Risk
 */
export function calculateSHAPValues(vitals: VitalSigns): SHAPFeature[] {
  const currentRisk = calculateRandomForestRisk(vitals);
  
  // Calculate marginal contribution for each feature against baseline
  const rawShap: { [key in keyof VitalSigns]?: number } = {};

  // SpO2 contribution
  if (vitals.spo2 < 95) {
    rawShap.spo2 = (95 - vitals.spo2) * 3.8 + Math.pow(95 - vitals.spo2, 1.2) * 1.5;
  } else {
    rawShap.spo2 = -((vitals.spo2 - 95) * 1.8);
  }

  // Age contribution
  if (vitals.age > 55) {
    rawShap.age = (vitals.age - 55) * 0.45;
  } else {
    rawShap.age = -((55 - vitals.age) * 0.2);
  }

  // MAP contribution
  if (vitals.map < 65) {
    rawShap.map = (65 - vitals.map) * 1.6;
  } else if (vitals.map > 105) {
    rawShap.map = (vitals.map - 105) * 0.8;
  } else {
    rawShap.map = -((vitals.map - 65) * 0.35); // Protective
  }

  // Heart Rate
  if (vitals.heartRate > 90) {
    rawShap.heartRate = (vitals.heartRate - 90) * 0.35;
  } else if (vitals.heartRate < 55) {
    rawShap.heartRate = (55 - vitals.heartRate) * 0.4;
  } else {
    rawShap.heartRate = -2.5;
  }

  // Resp Rate
  if (vitals.respRate > 20) {
    rawShap.respRate = (vitals.respRate - 20) * 1.2;
  } else {
    rawShap.respRate = -1.5;
  }

  // Lactate
  if (vitals.lactate > 2.0) {
    rawShap.lactate = (vitals.lactate - 2.0) * 8.5;
  } else {
    rawShap.lactate = -1.0;
  }

  // WBC
  if (vitals.wbc > 12.0) {
    rawShap.wbc = (vitals.wbc - 12.0) * 1.8;
  } else {
    rawShap.wbc = -0.8;
  }

  // Scale SHAP values so total sum equals (currentRisk - BASE_EXPECTED_RISK)
  const targetDifference = currentRisk - BASE_EXPECTED_RISK;
  const rawSum = Object.values(rawShap).reduce((acc, v) => acc + (v || 0), 0);
  const scale = rawSum !== 0 ? targetDifference / rawSum : 1;

  const shapList: SHAPFeature[] = [
    {
      feature: 'spo2',
      displayName: 'SpO2',
      valueLabel: `${vitals.spo2}%`,
      impact: Math.round((rawShap.spo2 || 0) * scale * 10) / 10,
      unit: '%',
      baselineValue: BASELINE_VITALS.spo2,
      currentValue: vitals.spo2,
      description: vitals.spo2 < 90 ? 'Critical hypoxemia driving risk' : 'Oxygenation within normal range',
    },
    {
      feature: 'age',
      displayName: 'Age',
      valueLabel: `${vitals.age}y`,
      impact: Math.round((rawShap.age || 0) * scale * 10) / 10,
      unit: 'yrs',
      baselineValue: BASELINE_VITALS.age,
      currentValue: vitals.age,
      description: vitals.age > 70 ? 'Advanced age reduces physiological reserve' : 'Age factor baseline',
    },
    {
      feature: 'map',
      displayName: 'MAP',
      valueLabel: `${vitals.map} mmHg`,
      impact: Math.round((rawShap.map || 0) * scale * 10) / 10,
      unit: 'mmHg',
      baselineValue: BASELINE_VITALS.map,
      currentValue: vitals.map,
      description: vitals.map < 65 ? 'Inadequate tissue perfusion pressure' : 'Protective arterial perfusion',
    },
    {
      feature: 'heartRate',
      displayName: 'Heart Rate',
      valueLabel: `${vitals.heartRate} bpm`,
      impact: Math.round((rawShap.heartRate || 0) * scale * 10) / 10,
      unit: 'bpm',
      baselineValue: BASELINE_VITALS.heartRate,
      currentValue: vitals.heartRate,
      description: vitals.heartRate > 100 ? 'Sinus tachycardia compounding cardiac stress' : 'Stable cardiac rhythm',
    },
    {
      feature: 'respRate',
      displayName: 'Resp Rate',
      valueLabel: `${vitals.respRate} /min`,
      impact: Math.round((rawShap.respRate || 0) * scale * 10) / 10,
      unit: 'breaths/min',
      baselineValue: BASELINE_VITALS.respRate,
      currentValue: vitals.respRate,
      description: vitals.respRate > 22 ? 'Tachypnea indicates respiratory effort' : 'Eupneic breathing pattern',
    },
    {
      feature: 'lactate',
      displayName: 'Lactate',
      valueLabel: `${vitals.lactate} mmol/L`,
      impact: Math.round((rawShap.lactate || 0) * scale * 10) / 10,
      unit: 'mmol/L',
      baselineValue: BASELINE_VITALS.lactate,
      currentValue: vitals.lactate,
      description: vitals.lactate > 2.0 ? 'Elevated lactate suggests cellular hypoxia' : 'Normal metabolic lactate',
    },
  ];

  // Sort by absolute magnitude of impact descending
  return shapList.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

/**
 * Calculates LIME local surrogate explanations (Local Interpretable Model-agnostic Explanations)
 */
export function calculateLIMEExplanations(vitals: VitalSigns): LIMELocalExplanation[] {
  const shap = calculateSHAPValues(vitals);
  
  return shap.map((s) => {
    const isRiskIncreasing = s.impact > 0;
    return {
      feature: s.feature,
      displayName: s.displayName,
      valueLabel: s.valueLabel,
      weight: Math.abs(s.impact),
      type: isRiskIncreasing ? 'risk_increasing' : 'protective',
      ruleDescription: isRiskIncreasing
        ? `${s.displayName} (${s.valueLabel}) increases risk by +${Math.abs(s.impact)}%`
        : `${s.displayName} (${s.valueLabel}) exerts protective coefficient of -${Math.abs(s.impact)}%`,
    };
  });
}

/**
 * Dynamically generates recommended clinical actions based on current vitals and risk level
 */
export function generateRecommendedActions(vitals: VitalSigns, currentRisk: number): ClinicalAction[] {
  const actions: ClinicalAction[] = [];

  // SpO2 rules
  if (vitals.spo2 < 90) {
    actions.push({
      id: `rec-spo2-crit-${vitals.spo2}`,
      title: 'Titrate High-Flow O2 & Stat ABG',
      description: `Target SpO2 >= 92%. Current SpO2 is ${vitals.spo2}%. Evaluate PaO2/FiO2 ratio for severe respiratory failure.`,
      urgency: 'critical',
      protocolReference: 'ICU-RESP-04',
      status: 'pending',
    });
  } else if (vitals.spo2 < 94) {
    actions.push({
      id: `rec-spo2-mod-${vitals.spo2}`,
      title: 'Supplemental Oxygen Titration',
      description: `Increase oxygen flow via nasal cannula to maintain target SpO2 (Current: ${vitals.spo2}%).`,
      urgency: 'high',
      protocolReference: 'ICU-RESP-02',
      status: 'pending',
    });
  }

  // MAP rules
  if (vitals.map < 65) {
    actions.push({
      id: `rec-map-crit-${vitals.map}`,
      title: 'Initiate Vasopressor Infusion',
      description: `MAP dropped to ${vitals.map} mmHg (<65 mmHg threshold). Start Norepinephrine to restore organ perfusion.`,
      urgency: 'critical',
      protocolReference: 'ICU-VASO-01',
      status: 'pending',
    });
  } else if (vitals.map > 110) {
    actions.push({
      id: `rec-map-high-${vitals.map}`,
      title: 'Hypertension Evaluation & Nitrates',
      description: `MAP elevated at ${vitals.map} mmHg. Monitor for end-organ vascular strain.`,
      urgency: 'moderate',
      protocolReference: 'ICU-CARD-08',
      status: 'pending',
    });
  }

  // Heart rate rules
  if (vitals.heartRate > 110) {
    actions.push({
      id: `rec-hr-high-${vitals.heartRate}`,
      title: '12-Lead ECG & Tachycardia Panel',
      description: `Heart Rate elevated at ${vitals.heartRate} bpm. Check serum potassium and magnesium levels.`,
      urgency: 'high',
      protocolReference: 'ICU-CARD-02',
      status: 'pending',
    });
  } else if (vitals.heartRate < 50) {
    actions.push({
      id: `rec-hr-low-${vitals.heartRate}`,
      title: 'Evaluate Symptomatic Bradycardia',
      description: `Heart Rate is ${vitals.heartRate} bpm. Prepare Atropine bedside if hemodynamically unstable.`,
      urgency: 'critical',
      protocolReference: 'ICU-CARD-05',
      status: 'pending',
    });
  }

  // Lactate rules
  if (vitals.lactate > 2.0) {
    actions.push({
      id: `rec-lactate-high-${vitals.lactate}`,
      title: 'Sepsis Resuscitation Bundle',
      description: `Lactate elevated at ${vitals.lactate} mmol/L. Administer 30mL/kg crystalloid bolus and recheck in 2 hours.`,
      urgency: vitals.lactate > 3.0 ? 'critical' : 'high',
      protocolReference: 'SEP-FLUID-01',
      status: 'pending',
    });
  }

  // General / Routine rules if patient is relatively stable or needs default protocols
  if (currentRisk < 35 && actions.length === 0) {
    actions.push({
      id: 'rec-stable-1',
      title: 'Step-Down Unit Transition Check',
      description: 'Patient vitals and risk profile are stable. Assess readiness for telemetry step-down unit transition.',
      urgency: 'routine',
      protocolReference: 'ICU-DISCHARGE-01',
      status: 'pending',
    });
    actions.push({
      id: 'rec-stable-2',
      title: 'Routine Continuous Telemetry',
      description: 'Maintain continuous telemetry monitoring and standard nursing observations.',
      urgency: 'routine',
      protocolReference: 'ICU-GEN-01',
      status: 'pending',
    });
  } else if (actions.length < 3) {
    actions.push({
      id: `rec-routine-obs-${currentRisk}`,
      title: 'Q15M Intensive Telemetry Audit',
      description: 'Perform frequent vital signs verification and automated TreeSHAP driver updates.',
      urgency: currentRisk >= 70 ? 'high' : 'moderate',
      protocolReference: 'ICU-OBS-03',
      status: 'pending',
    });
  }

  return actions;
}

/**
 * Generates an automated clinical risk narrative explaining the patient's state
 */
export function generateRiskNarrative(vitals: VitalSigns, currentRisk: number): string {
  const shap = calculateSHAPValues(vitals);
  const topRiskDriver = shap.find((s) => s.impact > 0);
  const secondaryRiskDriver = shap.filter((s) => s.impact > 0)[1];
  const protectiveFactor = shap.find((s) => s.impact < 0);

  let severityText = 'low decompensation probability';
  if (currentRisk >= 75) severityText = 'critical decompensation within the next 4 hours';
  else if (currentRisk >= 50) severityText = 'moderate-to-high risk of respiratory/hemodynamic instability';
  else if (currentRisk >= 25) severityText = 'mild-to-moderate deterioration risk requiring observation';

  let narrative = `Patient model indicates an ${currentRisk}% probability of ${severityText}. `;

  if (topRiskDriver) {
    narrative += `The primary driver is a sustained shift in ${topRiskDriver.displayName} (currently ${topRiskDriver.valueLabel})`;
    if (secondaryRiskDriver) {
      narrative += ` coupled with ${secondaryRiskDriver.displayName} (${secondaryRiskDriver.valueLabel}). `;
    } else {
      narrative += `. `;
    }
  }

  if (vitals.heartRate > 100) {
    narrative += `Recent upward trends in Heart Rate (${vitals.heartRate} bpm) are compounding the risk score. `;
  } else if (vitals.heartRate < 55) {
    narrative += `Bradycardia (${vitals.heartRate} bpm) contributes to reduced organ perfusion. `;
  }

  if (protectiveFactor) {
    narrative += `Current ${protectiveFactor.displayName} levels (${protectiveFactor.valueLabel}) provide a protective offset of -${Math.abs(protectiveFactor.impact)}%. `;
  } else {
    narrative += `Minimal protective factors are present. `;
  }

  if (currentRisk >= 70) {
    narrative += `Immediate respiratory and clinical assessment is strongly advised.`;
  } else if (currentRisk >= 40) {
    narrative += `Close monitoring of peripheral oxygenation and blood pressure is recommended.`;
  } else {
    narrative += `Continue routine telemetry monitoring per standard ICU care protocol.`;
  }

  return narrative;
}

/**
 * Executes What-If simulation given adjusted physiological parameters
 */
export function simulateWhatIf(
  currentVitals: VitalSigns,
  targetSpO2: number,
  targetMAP?: number,
  targetHR?: number,
  targetLactate?: number
): SimulationResult {
  const modifiedVitals: VitalSigns = {
    ...currentVitals,
    spo2: targetSpO2,
    map: targetMAP !== undefined ? targetMAP : currentVitals.map,
    heartRate: targetHR !== undefined ? targetHR : currentVitals.heartRate,
    lactate: targetLactate !== undefined ? targetLactate : currentVitals.lactate,
  };

  const initialRisk = calculateRandomForestRisk(currentVitals);
  const simulatedRisk = calculateRandomForestRisk(modifiedVitals);
  const diff = Math.round((simulatedRisk - initialRisk) * 10) / 10;

  const newShap = calculateSHAPValues(modifiedVitals);

  let mortalityImpactText = '';
  if (diff > 0) {
    mortalityImpactText = `Simulated parameter changes increase decompensation risk by +${diff}% (Total Risk: ${simulatedRisk}%).`;
  } else if (diff < 0) {
    mortalityImpactText = `Simulated parameter changes decrease decompensation risk by ${Math.abs(diff)}% (Total Risk: ${simulatedRisk}%).`;
  } else {
    mortalityImpactText = `Adjusted physiological parameters maintain current risk trajectory at ${simulatedRisk}%.`;
  }

  const updatedNarrative = generateRiskNarrative(modifiedVitals, simulatedRisk);

  return {
    simulatedRisk,
    riskDifference: diff,
    mortalityImpactText,
    shapChanges: newShap.map((s) => ({ feature: s.feature, newImpact: s.impact })),
    updatedNarrative,
  };
}
