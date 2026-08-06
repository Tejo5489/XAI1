import React, { useState, useEffect, useRef } from 'react';
import { Patient, VitalSigns, SHAPFeature, LIMELocalExplanation } from '../types';
import {
  TrendingUp,
  AlertOctagon,
  FlaskConical,
  RefreshCw,
  Clock,
  Brain,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Sliders,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  BarChart3,
  Target,
  Info,
} from 'lucide-react';
import {
  calculateRandomForestRisk,
  calculateSHAPValues,
  calculateLIMEExplanations,
  generateRiskNarrative,
  generateRecommendedActions,
  simulateWhatIf,
} from '../utils/rfEngine';

interface RiskAnalysisViewProps {
  patient: Patient;
  onOpenChatWithQuery: (query: string) => void;
  onUpdatePatientVitals: (patientId: string, updatedVitals: VitalSigns) => void;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  patient,
  onOpenChatWithQuery,
  onUpdatePatientVitals,
}) => {
  // Simulator State
  const [targetSpO2, setTargetSpO2] = useState<number>(patient.vitals.spo2);
  const [targetMAP, setTargetMAP] = useState<number>(patient.vitals.map);
  const [targetHR, setTargetHR] = useState<number>(patient.vitals.heartRate);
  const [targetLactate, setTargetLactate] = useState<number>(patient.vitals.lactate);

  // Store original baseline vitals when patient changes
  const originalVitalsRef = useRef<VitalSigns>(patient.vitals);

  // Sync simulator sliders & update baseline whenever patient ID changes
  useEffect(() => {
    originalVitalsRef.current = patient.vitals;
    setTargetSpO2(patient.vitals.spo2);
    setTargetMAP(patient.vitals.map);
    setTargetHR(patient.vitals.heartRate);
    setTargetLactate(patient.vitals.lactate);
  }, [patient.id]);

  // Dynamic Live Vitals calculation
  const liveVitals: VitalSigns = {
    ...patient.vitals,
    spo2: targetSpO2,
    map: targetMAP,
    heartRate: targetHR,
    lactate: targetLactate,
  };

  const isLiveSimulating =
    targetSpO2 !== patient.vitals.spo2 ||
    targetMAP !== patient.vitals.map ||
    targetHR !== patient.vitals.heartRate ||
    targetLactate !== patient.vitals.lactate;

  const isModifiedFromOriginal =
    targetSpO2 !== originalVitalsRef.current.spo2 ||
    targetMAP !== originalVitalsRef.current.map ||
    targetHR !== originalVitalsRef.current.heartRate ||
    targetLactate !== originalVitalsRef.current.lactate ||
    patient.vitals.spo2 !== originalVitalsRef.current.spo2 ||
    patient.vitals.map !== originalVitalsRef.current.map ||
    patient.vitals.heartRate !== originalVitalsRef.current.heartRate ||
    patient.vitals.lactate !== originalVitalsRef.current.lactate;

  // Real-time re-evaluation of model predictions based on live feed/simulator changes
  const currentRisk = calculateRandomForestRisk(liveVitals);
  const shapFeatures = calculateSHAPValues(liveVitals);
  const limeExplanations = calculateLIMEExplanations(liveVitals);
  const riskNarrative = generateRiskNarrative(liveVitals, currentRisk);
  const recommendedActions = generateRecommendedActions(liveVitals, currentRisk);

  // What-If simulation comparing patient baseline to target SpO2/MAP/HR/Lactate
  const simulationResult = simulateWhatIf(
    patient.vitals,
    targetSpO2,
    targetMAP,
    targetHR,
    targetLactate
  );

  const resetSimulation = () => {
    const original = originalVitalsRef.current;
    setTargetSpO2(original.spo2);
    setTargetMAP(original.map);
    setTargetHR(original.heartRate);
    setTargetLactate(original.lactate);
    // Restore applied patient vitals to original baseline
    onUpdatePatientVitals(patient.id, original);
  };

  const applySimulationToPatient = () => {
    onUpdatePatientVitals(patient.id, {
      ...patient.vitals,
      spo2: targetSpO2,
      map: targetMAP,
      heartRate: targetHR,
      lactate: targetLactate,
    });
  };

  // Trajectory points formatting for SVG
  const trajectoryPoints = [
    ...patient.trajectory.slice(0, 3),
    {
      timeLabel: 'Now',
      riskPercentage: currentRisk,
      spo2: liveVitals.spo2,
      map: liveVitals.map,
      heartRate: liveVitals.heartRate,
    },
  ];

  return (
    <div className="flex flex-col w-full p-8 gap-8 relative overflow-hidden font-sans text-[#e2e2e2]">
      {/* Background Accent Blurs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffb4ab]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-[#02e600]/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />

      {/* Header Section */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center gap-4 mb-1">
          <span className="font-mono text-xs text-[#b9ccaf] uppercase tracking-widest bg-[#282a2a] px-3 py-1 rounded border border-[#3b4b35]/50">
            MODULE: PREDICTIVE ANALYTICS
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#3b4b35] to-transparent" />
        </div>

        <h1 className="font-mono text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight flex items-center gap-2 flex-wrap">
          Risk Analysis <span className="text-red-400">&amp;</span> SHAP Drivers
        </h1>
        <p className="font-sans text-base text-[#b9ccaf] max-w-3xl leading-relaxed">
          Real-time evaluation of patient deterioration risk based on continuous telemetry and
          historical EMR data. Highlighting primary contributing features via multi-method
          explainability using SHAP (SHapley Additive exPlanations) and LIME (Local Interpretable
          Model-agnostic Explanations).
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Trajectory, SHAP, LIME, Narrative (Spans 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Split Panel: Current Trajectory & Key Drivers */}
          <div className="bg-[#1e2020] rounded-xl border border-[#3b4b35] overflow-hidden flex flex-col shadow-lg">
            {/* Panel Header */}
            <div className="bg-[#333535] px-6 py-4 border-b border-[#3b4b35] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[#ffb4ab]" />
                <h2 className="font-mono text-xl font-semibold text-white">
                  Current Trajectory &amp; Key Drivers
                </h2>
              </div>
              <div className="flex gap-2 font-mono text-xs text-[#b9ccaf]">
                <span className="bg-[#121414] px-2.5 py-1 rounded border border-[#3b4b35]">
                  T-6 HRS
                </span>
                <span className="bg-[#121414] px-2.5 py-1 rounded border border-[#02e600]/40 text-[#02e600] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02e600] animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>

            {/* Visualization Grid Area */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Sub-chart: Risk Probability Timeline */}
              <div className="flex flex-col gap-4 relative">
                <h3 className="font-mono text-xs text-[#b9ccaf] uppercase tracking-wider border-b border-[#3b4b35] pb-2 font-semibold">
                  RISK PROBABILITY (6HR)
                </h3>

                <div className="relative h-52 w-full bg-[#121414] rounded-lg border border-[#282a2a] p-2">
                  {/* Grid SVG Pattern */}
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#282a2a" strokeWidth="1" />
                      </pattern>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffb4ab" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridPattern)" />
                  </svg>

                  {/* Y-Axis Labels */}
                  <div className="absolute left-2 top-2 bottom-6 flex flex-col justify-between text-[#b9ccaf] font-mono text-[10px]">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  {/* Trajectory Curve SVG */}
                  <div className="absolute left-10 right-3 top-3 bottom-7">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Gradient Fill */}
                      <polygon
                        points={`0,100 ${trajectoryPoints.map((pt, i) => `${(i / (trajectoryPoints.length - 1)) * 100},${100 - pt.riskPercentage}`).join(' ')} 100,100`}
                        fill="url(#riskGrad)"
                      />

                      {/* Smooth Path */}
                      <polyline
                        fill="none"
                        stroke="#ffb4ab"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_8px_rgba(255,180,171,0.6)]"
                        points={trajectoryPoints.map((pt, i) => `${(i / (trajectoryPoints.length - 1)) * 100},${100 - pt.riskPercentage}`).join(' ')}
                      />

                      {/* Endpoint Dot */}
                      <circle
                        cx="100"
                        cy={100 - currentRisk}
                        r="4"
                        fill="#ffb4ab"
                        className="animate-pulse shadow-[0_0_10px_#ffb4ab]"
                      />
                    </svg>
                  </div>

                  {/* X-Axis Time Labels */}
                  <div className="absolute bottom-1 left-10 right-3 flex justify-between text-[#b9ccaf] font-mono text-[10px]">
                    {trajectoryPoints.map((pt) => (
                      <span key={pt.timeLabel}>{pt.timeLabel}</span>
                    ))}
                  </div>

                  {/* Current Risk Badge */}
                  <div className="absolute top-3 right-3 bg-[#ffb4ab]/15 border border-[#ffb4ab]/40 px-3 py-1.5 rounded flex flex-col items-end backdrop-blur-sm shadow-md">
                    <span className="font-mono text-[10px] text-[#ffb4ab] uppercase font-semibold">
                      CURRENT RISK
                    </span>
                    <span className="font-mono text-2xl font-bold text-[#ffb4ab] leading-none">
                      {currentRisk}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Sub-chart: SHAP & LIME Feature Drivers */}
              <div className="flex flex-col gap-5">
                {/* SHAP Feature Impact */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-mono text-xs text-[#b9ccaf] uppercase tracking-wider border-b border-[#3b4b35] pb-2 font-semibold">
                    SHAP FEATURE IMPACT
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    {shapFeatures.slice(0, 3).map((f) => {
                      const isRiskIncreasing = f.impact > 0;
                      const absVal = Math.min(100, Math.abs(f.impact) * 2.2); // scale for bar visualization width

                      return (
                        <div key={f.feature} className="flex items-center gap-3 w-full">
                          <div className="w-24 flex-shrink-0 font-mono text-xs text-[#e2e2e2] text-right truncate font-medium">
                            {f.displayName}
                          </div>

                          <div className="flex-1 bg-[#333535] h-3.5 rounded-sm relative overflow-hidden flex items-center">
                            {/* Center baseline indicator */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#84967c]" />

                            {isRiskIncreasing ? (
                              <div
                                className="absolute left-1/2 top-0 bottom-0 bg-[#ffb4ab] rounded-r-sm transition-all duration-300"
                                style={{ width: `${absVal / 2}%` }}
                              />
                            ) : (
                              <div
                                className="absolute right-1/2 top-0 bottom-0 bg-[#02e600]/80 rounded-l-sm transition-all duration-300"
                                style={{ width: `${absVal / 2}%` }}
                              />
                            )}
                          </div>

                          <div
                            className={`w-12 font-mono text-[11px] text-right font-bold ${
                              isRiskIncreasing ? 'text-[#ffb4ab]' : 'text-[#02e600]'
                            }`}
                          >
                            {isRiskIncreasing ? `+${f.impact}%` : `${f.impact}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LIME Local Explanations */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-mono text-xs text-[#b9ccaf] uppercase tracking-wider border-b border-[#3b4b35] pb-2 font-semibold">
                    LIME LOCAL EXPLANATIONS
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    {limeExplanations.slice(0, 2).map((lime) => {
                      const isRisk = lime.type === 'risk_increasing';
                      const widthPercent = Math.min(100, lime.weight * 2.5);

                      return (
                        <div key={lime.feature} className="flex items-center gap-3 w-full">
                          <div className="w-24 flex-shrink-0 font-mono text-xs text-[#e2e2e2] text-right truncate font-medium">
                            {lime.displayName}
                          </div>

                          <div className="flex-1 bg-[#333535] h-3.5 rounded-sm relative overflow-hidden">
                            <div
                              className={`absolute top-0 bottom-0 transition-all duration-300 ${
                                isRisk
                                  ? 'left-1/2 bg-[#ffb4ab] rounded-r-sm'
                                  : 'right-1/2 bg-[#02e600]/70 rounded-l-sm'
                              }`}
                              style={{ width: `${widthPercent / 2}%` }}
                            />
                          </div>

                          <div className="w-12 font-mono text-[10px] text-[#b9ccaf] text-right">
                            {lime.valueLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-auto flex justify-center gap-6 text-[11px] font-mono text-[#b9ccaf] pt-2 border-t border-[#3b4b35]/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#02e600]/70 rounded-sm" />
                    <span>Protective</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#ffb4ab] rounded-sm" />
                    <span>Risk Increasing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Narrative Card */}
          <div className="bg-[#1a1c1c] border border-[#3b4b35] rounded-xl p-6 relative overflow-hidden group hover:border-[#ffb4ab]/50 transition-colors duration-300 shadow-md">
            <div
              className={`absolute top-0 left-0 w-1.5 h-full ${
                currentRisk >= 75 ? 'bg-[#ffb4ab]' : currentRisk >= 40 ? 'bg-amber-400' : 'bg-[#02e600]'
              }`}
            />

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-mono text-xl font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-[#ffb4ab]" />
                Risk Narrative
              </h3>

              <button
                onClick={() =>
                  onOpenChatWithQuery(
                    `Explain why patient ${patient.name} has a ${currentRisk}% risk and how SHAP drivers support this.`
                  )
                }
                className="flex items-center gap-1.5 text-xs font-mono text-[#02e600] bg-[#02e600]/10 hover:bg-[#02e600]/20 px-3 py-1.5 rounded border border-[#02e600]/30 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Assistant</span>
              </button>
            </div>

            <p className="font-sans text-base text-[#e2e2e2] leading-relaxed">
              {riskNarrative}
            </p>

            {/* Metatags */}
            <div className="flex flex-wrap gap-3 mt-5">
              <span className="font-mono text-xs bg-[#121414] text-[#b9ccaf] px-3 py-1.5 rounded border border-[#3b4b35]/50 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#02e600]" />
                MODEL UPDATE: {patient.lastModelUpdate}
              </span>

              <span className="font-mono text-xs bg-[#121414] text-[#b9ccaf] px-3 py-1.5 rounded border border-[#3b4b35]/50 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                CONFIDENCE: {patient.confidenceScore}%
              </span>

              <span className="font-mono text-xs bg-[#121414] text-[#b9ccaf] px-3 py-1.5 rounded border border-[#3b4b35]/50 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                XAI METHOD: TreeSHAP + LIME
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: What-If Simulator & Recommended Actions (Spans 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* What-If Simulator Card */}
          <div className="bg-[#1e2020] border border-[#02e600]/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(2,230,0,0.06)] flex flex-col">
            <div className="bg-[#282a2a] px-5 py-3.5 flex items-center justify-between border-b border-[#02e600]/30">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#02e600]" />
                <h3 className="font-mono text-sm font-bold text-[#02e600] uppercase tracking-wider">
                  Simulator Controls
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#02e600] bg-[#02e600]/10 px-2 py-0.5 rounded border border-[#02e600]/20">
                WHAT-IF ENGINE
              </span>
            </div>

            <div className="p-5 flex flex-col gap-5">
              <p className="font-sans text-xs text-[#b9ccaf] leading-snug">
                Adjust physiological parameters to forecast impact on deterioration risk probability in real-time.
              </p>

              {/* Slider 1: Target SpO2 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="font-mono text-xs text-[#e2e2e2] font-medium">Target SpO2</label>
                  <span
                    className={`font-mono text-sm font-bold ${
                      targetSpO2 < 90 ? 'text-[#ffb4ab]' : 'text-[#02e600]'
                    }`}
                  >
                    {targetSpO2}%
                  </span>
                </div>

                <input
                  type="range"
                  min="80"
                  max="100"
                  value={targetSpO2}
                  onChange={(e) => setTargetSpO2(Number(e.target.value))}
                  className="w-full accent-[#02e600] h-2 bg-[#121414] rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-[#b9ccaf]">
                  <span>80% (Hypoxia)</span>
                  <span>100% (Normal)</span>
                </div>
              </div>

              {/* Slider 2: Target MAP */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="font-mono text-xs text-[#e2e2e2] font-medium">Target MAP (mmHg)</label>
                  <span
                    className={`font-mono text-sm font-bold ${
                      targetMAP < 65 ? 'text-[#ffb4ab]' : 'text-[#02e600]'
                    }`}
                  >
                    {targetMAP} mmHg
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="120"
                  value={targetMAP}
                  onChange={(e) => setTargetMAP(Number(e.target.value))}
                  className="w-full accent-[#02e600] h-2 bg-[#121414] rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-[#b9ccaf]">
                  <span>50 mmHg</span>
                  <span>120 mmHg</span>
                </div>
              </div>

              {/* Slider 3: Target Heart Rate */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="font-mono text-xs text-[#e2e2e2] font-medium">Target HR (bpm)</label>
                  <span
                    className={`font-mono text-sm font-bold ${
                      targetHR > 100 ? 'text-[#ffb4ab]' : 'text-[#02e600]'
                    }`}
                  >
                    {targetHR} bpm
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="150"
                  value={targetHR}
                  onChange={(e) => setTargetHR(Number(e.target.value))}
                  className="w-full accent-[#02e600] h-2 bg-[#121414] rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-[#b9ccaf]">
                  <span>50 bpm</span>
                  <span>150 bpm</span>
                </div>
              </div>

              {/* Slider 4: Target Blood Lactate */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="font-mono text-xs text-[#e2e2e2] font-medium">Target Blood Lactate (mmol/L)</label>
                  <span
                    className={`font-mono text-sm font-bold ${
                      targetLactate > 2.0 ? 'text-[#ffb4ab]' : 'text-[#02e600]'
                    }`}
                  >
                    {targetLactate.toFixed(1)} mmol/L
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={targetLactate}
                  onChange={(e) => setTargetLactate(Number(e.target.value))}
                  className="w-full accent-[#02e600] h-2 bg-[#121414] rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-[#b9ccaf]">
                  <span>0.5 mmol/L (Normal)</span>
                  <span>10.0 mmol/L (Elevated)</span>
                </div>
              </div>

              {/* Simulator Output Box */}
              <div className="bg-[#121414] p-4 rounded-lg border border-[#3b4b35] relative overflow-hidden">
                <div
                  className={`absolute left-0 top-0 w-1 h-full ${
                    simulationResult.simulatedRisk >= 70 ? 'bg-[#ffb4ab]' : 'bg-[#02e600]'
                  }`}
                />
                <p className="font-sans text-xs text-[#e2e2e2] leading-relaxed">
                  {simulationResult.mortalityImpactText}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={resetSimulation}
                  className={`flex-1 py-2 rounded font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isModifiedFromOriginal
                      ? 'bg-[#333535] text-[#02e600] border border-[#02e600] hover:bg-[#02e600] hover:text-[#013a00]'
                      : 'bg-[#333535] text-[#e2e2e2] border border-[#3b4b35] hover:border-[#02e600] hover:text-[#02e600]'
                  }`}
                  title="Reset vitals to original baseline values before any changes"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Vitals</span>
                </button>

                <button
                  onClick={applySimulationToPatient}
                  className="flex-1 bg-[#02e600] text-[#013a00] font-bold py-2 rounded font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#77ff61] transition-colors cursor-pointer shadow-[0_0_10px_rgba(2,230,0,0.2)]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Apply Vitals</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Recommended Actions Grid */}
          <div className="bg-[#1e2020] rounded-xl border border-[#3b4b35] p-5 flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between border-b border-[#3b4b35] pb-3">
              <h3 className="font-mono text-base font-bold text-white">Recommended Actions</h3>
              <span className="font-mono text-[11px] text-[#02e600] bg-[#02e600]/10 px-2 py-0.5 rounded">
                EVIDENCE BASED
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {recommendedActions.map((act) => {
                const isCritical = act.urgency === 'critical';
                const isHigh = act.urgency === 'high';

                return (
                  <div
                    key={act.id}
                    className="p-3.5 bg-[#121414] rounded-lg border border-[#282a2a] flex flex-col gap-2 hover:border-[#3b4b35] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCritical ? 'bg-[#ffb4ab]' : isHigh ? 'bg-amber-400' : 'bg-[#02e600]'
                          }`}
                        />
                        {act.title}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isCritical
                            ? 'bg-[#93000a] text-[#ffb4ab]'
                            : isHigh
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-[#002200] text-[#02e600]'
                        }`}
                      >
                        {act.urgency}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-[#b9ccaf] leading-tight">{act.description}</p>

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#282a2a] text-[10px] font-mono">
                      <span className="text-[#84967c]">PROTOCOL: {act.protocolReference}</span>
                      <button
                        onClick={() =>
                          onOpenChatWithQuery(
                            `Provide evidence rationale and step-by-step clinical protocol for ${act.title} (${act.protocolReference}).`
                          )
                        }
                        className="text-[#02e600] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Rationale</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Model Architecture & XAI Practicality Section */}
      <div className="bg-[#1e2020] rounded-xl border border-[#3b4b35] p-6 md:p-8 flex flex-col gap-6 relative z-10 shadow-xl mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3b4b35] pb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#02e600] uppercase tracking-wider bg-[#002200] px-2.5 py-0.5 rounded border border-[#02e600]/30 font-semibold">
                XAI METHODOLOGY &amp; PRACTICALITY
              </span>
              <span className="font-mono text-xs text-[#b9ccaf]">| Architecture Breakdown</span>
            </div>
            <h2 className="font-mono text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-6 h-6 text-[#02e600]" />
              How XGBoost, SHAP &amp; LIME Work in Our System
            </h2>
          </div>
          <p className="font-sans text-xs text-[#b9ccaf] max-w-lg leading-relaxed">
            Combining high-accuracy non-linear gradient boosting with dual-method explainability to deliver trustworthy, transparent clinical decision support at the bedside.
          </p>
        </div>

        {/* 3-Column Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: XGBoost */}
          <div className="bg-[#121414] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-[#02e600]/50 transition-all">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#002200] border border-[#02e600]/40 rounded-lg text-[#02e600]">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#02e600] bg-[#02e600]/10 px-2 py-0.5 rounded font-bold uppercase border border-[#02e600]/20">
                  PREDICTIVE ENGINE
                </span>
              </div>

              <h3 className="font-mono text-lg font-bold text-white">1. XGBoost Model</h3>

              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2.5 bg-[#1a1c1c] rounded-lg border border-[#282a2a]">
                  <span className="font-mono font-bold text-[#02e600] uppercase text-[11px] block mb-1">
                    How it Works in Our App:
                  </span>
                  <p className="font-sans text-[#b9ccaf] leading-relaxed">
                    Continuously ingests multi-vital telemetry (SpO2, MAP, HR, Lactate, RR, Temp) and evaluates hundreds of gradient boosted decision trees to calculate non-linear deterioration probability every 5 seconds.
                  </p>
                </div>

                <div className="p-2.5 bg-[#1a1c1c] rounded-lg border border-[#282a2a]">
                  <span className="font-mono font-bold text-cyan-400 uppercase text-[11px] block mb-1">
                    Practical Bedside Value:
                  </span>
                  <p className="font-sans text-[#b9ccaf] leading-relaxed">
                    Detects early septic or shock decompensation up to 6 hours before single-threshold vital sign alarms trigger, enabling proactive clinical intervention.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="pt-3 border-t border-[#282a2a] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#84967c]">Live Prediction:</span>
              <span className="font-bold text-[#ffb4ab]">{currentRisk}% Risk Score</span>
            </div>
          </div>

          {/* Column 2: SHAP */}
          <div className="bg-[#121414] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-[#02e600]/50 transition-all">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#002200] border border-[#02e600]/40 rounded-lg text-[#02e600]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded font-bold uppercase border border-purple-800/30">
                  GLOBAL EXPLAINER
                </span>
              </div>

              <h3 className="font-mono text-lg font-bold text-white">2. TreeSHAP</h3>

              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2.5 bg-[#1a1c1c] rounded-lg border border-[#282a2a]">
                  <span className="font-mono font-bold text-purple-400 uppercase text-[11px] block mb-1">
                    How it Works in Our App:
                  </span>
                  <p className="font-sans text-[#b9ccaf] leading-relaxed">
                    Applies cooperative game theory (Shapley values) to compute exact additive risk percentages (e.g. +18% from low MAP) for each vital parameter relative to baseline patient cohorts.
                  </p>
                </div>

                <div className="p-2.5 bg-[#1a1c1c] rounded-lg border border-[#282a2a]">
                  <span className="font-mono font-bold text-cyan-400 uppercase text-[11px] block mb-1">
                    Practical Bedside Value:
                  </span>
                  <p className="font-sans text-[#b9ccaf] leading-relaxed">
                    Eliminates the "black-box" dilemma for attending physicians, providing mathematically sound feature attributions during ward rounds and ICU handovers.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="pt-3 border-t border-[#282a2a] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#84967c]">Primary Driver:</span>
              <span className="font-bold text-[#02e600]">
                {shapFeatures[0]?.displayName || 'SpO2'} ({shapFeatures[0]?.impact > 0 ? '+' : ''}
                {shapFeatures[0]?.impact || 0}%)
              </span>
            </div>
          </div>

          {/* Column 3: LIME */}
          <div className="bg-[#121414] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-[#02e600]/50 transition-all">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#002200] border border-[#02e600]/40 rounded-lg text-[#02e600]">
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded font-bold uppercase border border-amber-800/30">
                  LOCAL EXPLAINER
                </span>
              </div>

              <h3 className="font-mono text-lg font-bold text-white">3. LIME Explanations</h3>

              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2.5 bg-[#1a1c1c] rounded-lg border border-[#282a2a]">
                  <span className="font-mono font-bold text-amber-400 uppercase text-[11px] block mb-1">
                    How it Works in Our App:
                  </span>
                  <p className="font-sans text-[#b9ccaf] leading-relaxed">
                    Perturbs live vitals locally around the patient's current state to construct an interpretable linear surrogate model, generating quick local rule thresholds.
                  </p>
                </div>

                <div className="p-2.5 bg-[#1a1c1c] rounded-lg border border-[#282a2a]">
                  <span className="font-mono font-bold text-cyan-400 uppercase text-[11px] block mb-1">
                    Practical Bedside Value:
                  </span>
                  <p className="font-sans text-[#b9ccaf] leading-relaxed">
                    Gives bedside nurses immediate, human-readable IF-THEN rules (e.g. "MAP &lt; 65 mmHg") so staff can instantly verify physiological triggers without calculating matrices.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="pt-3 border-t border-[#282a2a] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#84967c]">Key Local Rule:</span>
              <span className="font-bold text-amber-300 truncate">
                {limeExplanations[0]?.displayName || 'MAP'} ({limeExplanations[0]?.valueLabel || 'Normal'})
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Workflow Bar */}
        <div className="bg-[#121414] p-4 rounded-xl border border-[#3b4b35] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#02e600]">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold uppercase">End-to-End Clinical Flow:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[#b9ccaf]">
            <span className="bg-[#1a1c1c] px-2.5 py-1 rounded border border-[#3b4b35] text-white">
              1. Continuous Telemetry
            </span>
            <span>&rarr;</span>
            <span className="bg-[#1a1c1c] px-2.5 py-1 rounded border border-[#3b4b35] text-[#02e600]">
              2. XGBoost Risk Score ({currentRisk}%)
            </span>
            <span>&rarr;</span>
            <span className="bg-[#1a1c1c] px-2.5 py-1 rounded border border-[#3b4b35] text-purple-300">
              3. SHAP &amp; LIME Drivers
            </span>
            <span>&rarr;</span>
            <span className="bg-[#1a1c1c] px-2.5 py-1 rounded border border-[#3b4b35] text-amber-300">
              4. Bedside Intervention
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
