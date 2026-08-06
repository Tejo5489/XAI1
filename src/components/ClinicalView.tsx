import React from 'react';
import { Patient } from '../types';
import { Activity, Heart, Thermometer, Wind, Droplet, Shield, Stethoscope, FileText } from 'lucide-react';

interface ClinicalViewProps {
  patient: Patient;
  onOpenChatWithQuery: (query: string) => void;
  onOpenExportReport?: () => void;
}

export const ClinicalView: React.FC<ClinicalViewProps> = ({ patient, onOpenChatWithQuery, onOpenExportReport }) => {
  return (
    <div className="flex flex-col w-full p-8 gap-8 font-sans text-[#e2e2e2]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-[#b9ccaf] uppercase tracking-widest bg-[#282a2a] px-3 py-1 rounded border border-[#3b4b35]/50">
            MODULE: CLINICAL TELEMETRY &amp; EMR
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#3b4b35] to-transparent" />
        </div>
        <h1 className="font-mono text-3xl font-bold text-white">
          Bed {patient.bedNumber} — Clinical Telemetry &amp; Vitals
        </h1>
        <p className="font-sans text-sm text-[#b9ccaf]">
          Continuous physiological monitor feed for {patient.name} (Age: {patient.age}, Gender: {patient.gender}). Diagnosis: {patient.admissionDiagnosis}.
        </p>
      </div>

      {/* Vitals Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: SpO2 */}
        <div className="bg-[#1e2020] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#b9ccaf]">
            <span className="font-mono text-xs uppercase font-semibold flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Oxygen Saturation
            </span>
            <span className="font-mono text-[10px] bg-[#121414] px-2 py-0.5 rounded text-cyan-400">SpO2</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-bold ${patient.vitals.spo2 < 90 ? 'text-[#ffb4ab]' : 'text-[#02e600]'}`}>
              {patient.vitals.spo2}
            </span>
            <span className="font-mono text-sm text-[#b9ccaf]">%</span>
          </div>
          <span className="font-mono text-[11px] text-[#84967c]">Target: &gt;= 92%</span>
        </div>

        {/* Card 2: Heart Rate */}
        <div className="bg-[#1e2020] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#b9ccaf]">
            <span className="font-mono text-xs uppercase font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              Heart Rate
            </span>
            <span className="font-mono text-[10px] bg-[#121414] px-2 py-0.5 rounded text-red-400">ECG</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-bold ${patient.vitals.heartRate > 100 ? 'text-[#ffb4ab]' : 'text-white'}`}>
              {patient.vitals.heartRate}
            </span>
            <span className="font-mono text-sm text-[#b9ccaf]">bpm</span>
          </div>
          <span className="font-mono text-[11px] text-[#84967c]">Normal: 60-100 bpm</span>
        </div>

        {/* Card 3: MAP */}
        <div className="bg-[#1e2020] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#b9ccaf]">
            <span className="font-mono text-xs uppercase font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Mean Arterial BP
            </span>
            <span className="font-mono text-[10px] bg-[#121414] px-2 py-0.5 rounded text-amber-400">MAP</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-bold ${patient.vitals.map < 65 ? 'text-[#ffb4ab]' : 'text-white'}`}>
              {patient.vitals.map}
            </span>
            <span className="font-mono text-sm text-[#b9ccaf]">mmHg</span>
          </div>
          <span className="font-mono text-[11px] text-[#84967c]">Goal: &gt;= 65 mmHg</span>
        </div>

        {/* Card 4: Lactate */}
        <div className="bg-[#1e2020] p-5 rounded-xl border border-[#3b4b35] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#b9ccaf]">
            <span className="font-mono text-xs uppercase font-semibold flex items-center gap-2">
              <Droplet className="w-4 h-4 text-purple-400" />
              Blood Lactate
            </span>
            <span className="font-mono text-[10px] bg-[#121414] px-2 py-0.5 rounded text-purple-400">LAB</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-bold ${patient.vitals.lactate > 2.0 ? 'text-[#ffb4ab]' : 'text-white'}`}>
              {patient.vitals.lactate}
            </span>
            <span className="font-mono text-sm text-[#b9ccaf]">mmol/L</span>
          </div>
          <span className="font-mono text-[11px] text-[#84967c]">Normal: &lt; 2.0 mmol/L</span>
        </div>
      </div>

      {/* ECG & Waveforms Box */}
      <div className="bg-[#1e2020] p-6 rounded-xl border border-[#3b4b35] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#3b4b35] pb-3">
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#02e600]" />
            Live Waveform Simulation (Lead II ECG &amp; Plethysmograph)
          </h2>
          <span className="font-mono text-xs text-[#02e600] flex items-center gap-1.5 bg-[#02e600]/10 px-2.5 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-[#02e600] animate-ping" />
            250 Hz TELEMETRY FEED
          </span>
        </div>

        {/* Waveform Canvas Simulation */}
        <div className="h-32 bg-[#0d0f0f] rounded-lg border border-[#282a2a] relative overflow-hidden flex items-center p-2">
          <svg className="w-full h-24 stroke-[#02e600]" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path
              d="M 0 50 L 50 50 L 60 20 L 70 80 L 80 10 L 90 60 L 100 50 L 200 50 L 210 20 L 220 80 L 230 10 L 240 60 L 250 50 L 350 50 L 360 20 L 370 80 L 380 10 L 390 60 L 400 50 L 500 50 L 510 20 L 520 80 L 530 10 L 540 60 L 550 50 L 650 50 L 660 20 L 670 80 L 680 10 L 690 60 L 700 50 L 800 50 L 810 20 L 820 80 L 830 10 L 840 60 L 850 50 L 1000 50"
              fill="none"
              strokeWidth="2"
              className="drop-shadow-[0_0_6px_#02e600]"
            />
          </svg>
        </div>
      </div>

      {/* EMR Progress Notes */}
      <div className="bg-[#1e2020] p-6 rounded-xl border border-[#3b4b35] flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-400" />
          Electronic Health Record (EHR) Clinical Summary
        </h2>

        <div className="bg-[#121414] p-4 rounded-lg border border-[#282a2a] font-sans text-sm text-[#e2e2e2] leading-relaxed">
          {patient.emrNotes}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {onOpenExportReport && (
            <button
              onClick={onOpenExportReport}
              className="font-mono text-xs text-[#02e600] bg-[#002200] hover:bg-[#02e600] hover:text-[#013a00] px-4 py-2 rounded-lg border border-[#02e600] transition-all font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(2,230,0,0.15)]"
            >
              <FileText className="w-4 h-4" />
              <span>Export Discharge Report</span>
            </button>
          )}

          <button
            onClick={() =>
              onOpenChatWithQuery(
                `Provide a comprehensive medical report summarizing EHR notes and SHAP risk factors for ${patient.name}.`
              )
            }
            className="font-mono text-xs text-[#b9ccaf] hover:text-white bg-[#121414] hover:bg-[#252828] px-4 py-2 rounded-lg border border-[#3b4b35] transition-colors cursor-pointer"
          >
            Generate AI Clinical Briefing
          </button>
        </div>
      </div>
    </div>
  );
};
