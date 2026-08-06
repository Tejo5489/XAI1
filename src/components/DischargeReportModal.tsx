import React, { useState } from 'react';
import { Patient, ClinicalUser } from '../types';
import {
  calculateRandomForestRisk,
  calculateSHAPValues,
  calculateLIMEExplanations,
} from '../utils/rfEngine';
import {
  FileText,
  Printer,
  Download,
  Copy,
  X,
  Check,
  ShieldCheck,
  Activity,
  AlertCircle,
  UserCheck,
  Calendar,
  ClipboardList,
} from 'lucide-react';

interface DischargeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  currentUser: ClinicalUser | null;
}

export const DischargeReportModal: React.FC<DischargeReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  currentUser,
}) => {
  const [dischargeStatus, setDischargeStatus] = useState<'Stable' | 'Transfer to Ward' | 'Home Discharge' | 'Step-Down'>('Home Discharge');
  const [dischargeNotes, setDischargeNotes] = useState<string>(
    `Patient ${patient.name} has maintained hemodynamic stability over the past 24 hours. Vital parameters are within acceptable clinical limits. Risk score is ${calculateRandomForestRisk(patient.vitals)}%. Cleared for transfer/discharge.`
  );
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const currentRisk = calculateRandomForestRisk(patient.vitals);
  const shapFeatures = calculateSHAPValues(patient.vitals);
  const limeExplanations = calculateLIMEExplanations(patient.vitals);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      hospitalName: 'St. Jude Intensive Care Unit & Telemetry Center',
      reportType: 'ICU Patient Clinical Discharge & XAI Summary',
      exportTimestamp: new Date().toISOString(),
      patient: {
        id: patient.id,
        bedNumber: patient.bedNumber,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        admissionDate: patient.admissionDate,
        primaryDiagnosis: patient.primaryDiagnosis,
        dischargeStatus: dischargeStatus,
      },
      finalVitals: patient.vitals,
      xaiRiskAssessment: {
        xgboostDeteriorationRiskPercent: currentRisk,
        shapKeyDrivers: shapFeatures.map((f) => ({
          feature: f.displayName,
          impactPercent: f.impact,
          description: f.description,
        })),
        limeLocalRules: limeExplanations.map((l) => ({
          feature: l.displayName,
          ruleDescription: l.ruleDescription,
          valueLabel: l.valueLabel,
        })),
      },
      dischargeNotes: dischargeNotes,
      attendingStaff: {
        name: currentUser?.name || 'Authorized Staff',
        staffId: currentUser?.staffId || 'N/A',
        role: currentUser?.roleTitle || currentUser?.role || 'Clinician',
        department: currentUser?.department || 'ICU Unit',
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Discharge_Report_${patient.id}_${patient.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyText = () => {
    const summaryText = `
=== ICU CLINICAL DISCHARGE REPORT ===
Facility: St. Jude Intensive Care & Telemetry Center
Date: ${formattedDate}
Patient: ${patient.name} (ID: ${patient.id} | Bed #${patient.bedNumber})
Demographics: ${patient.age} yrs, ${patient.gender}
Diagnosis: ${patient.primaryDiagnosis}
Admission Date: ${patient.admissionDate}
Discharge Disposition: ${dischargeStatus}

--- FINAL DISCHARGE VITALS ---
SpO2: ${patient.vitals.spo2}%
MAP: ${patient.vitals.map} mmHg
Heart Rate: ${patient.vitals.heartRate} bpm
Respiration Rate: ${patient.vitals.respirationRate} bpm
Lactate: ${patient.vitals.lactate} mmol/L
Temperature: ${patient.vitals.temperature}°C
GCS Score: ${patient.vitals.gcs}

--- XAI DETERIORATION RISK ASSESSMENT ---
XGBoost Risk Score: ${currentRisk}% (${currentRisk > 50 ? 'HIGH RISK' : currentRisk > 25 ? 'MODERATE RISK' : 'LOW RISK'})
Key SHAP Drivers: ${shapFeatures.slice(0, 3).map((f) => `${f.displayName} (${f.impact > 0 ? '+' : ''}${f.impact}%)`).join(', ')}

--- CLINICAL SUMMARY & PLAN ---
${dischargeNotes}

Attesting Clinician: ${currentUser?.name || 'Staff Clinician'} (${currentUser?.staffId || 'Staff ID'})
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Modal Card container */}
      <div className="bg-[#1a1c1c] text-[#e2e2e2] border border-[#3b4b35] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black print:max-h-none print:w-full">
        
        {/* Header bar (Hidden during print) */}
        <div className="p-4 sm:p-5 bg-[#1e2020] border-b border-[#3b4b35] flex items-center justify-between gap-4 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#002200] border border-[#02e600]/40 rounded-xl text-[#02e600]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                Export Patient Discharge Report
              </h2>
              <p className="font-sans text-xs text-[#b9ccaf]">
                Bed #{patient.bedNumber} • {patient.name} (ID: {patient.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-[#252828] hover:bg-[#333535] border border-[#3b4b35] rounded-lg font-mono text-xs text-[#b9ccaf] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy text summary to clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-[#02e600]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-[#252828] hover:bg-[#333535] border border-[#3b4b35] rounded-lg font-mono text-xs text-[#b9ccaf] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download structured JSON report file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#02e600] hover:bg-[#77ff61] text-[#013a00] font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(2,230,0,0.2)] transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#84967c] hover:text-white rounded-lg hover:bg-[#252828] transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col gap-6 font-sans print:p-8 print:text-black print:bg-white print:overflow-visible">
          
          {/* Printable Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b4b35] print:border-gray-300 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-[#02e600] print:text-emerald-700" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#02e600] print:text-emerald-700">
                  ST. JUDE MEDICAL CENTER • ICU TELEMETRY
                </span>
              </div>
              <h1 className="font-mono text-2xl font-bold text-white print:text-black tracking-tight">
                PATIENT DISCHARGE &amp; CLINICAL SUMMARY REPORT
              </h1>
              <p className="font-mono text-xs text-[#b9ccaf] print:text-gray-600 mt-0.5">
                Generated: {formattedDate}
              </p>
            </div>

            <div className="p-3 bg-[#121414] print:bg-gray-50 border border-[#3b4b35] print:border-gray-300 rounded-xl font-mono text-xs flex flex-col gap-1 min-w-[200px]">
              <div className="flex justify-between">
                <span className="text-[#84967c] print:text-gray-500">Report ID:</span>
                <span className="font-bold text-white print:text-black">RPT-{patient.id}-{Date.now().toString().slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#84967c] print:text-gray-500">Disposition:</span>
                <span className="font-bold text-[#02e600] print:text-emerald-700">{dischargeStatus}</span>
              </div>
            </div>
          </div>

          {/* Patient Demographics Box */}
          <div className="bg-[#121414] print:bg-gray-50 p-5 rounded-xl border border-[#3b4b35] print:border-gray-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Patient Name:</span>
              <span className="font-bold text-white print:text-black text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">MRN / Patient ID:</span>
              <span className="font-bold text-[#02e600] print:text-black">{patient.id}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Bed Location:</span>
              <span className="font-bold text-white print:text-black">Bed #{patient.bedNumber}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Age / Gender:</span>
              <span className="font-bold text-white print:text-black">{patient.age} yrs / {patient.gender}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Admission Date:</span>
              <span className="font-bold text-white print:text-black">{patient.admissionDate}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Primary Diagnosis:</span>
              <span className="font-bold text-amber-400 print:text-amber-800">{patient.primaryDiagnosis}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Attending Clinician:</span>
              <span className="font-bold text-white print:text-black">{currentUser?.name || 'Duty Intensivist'}</span>
            </div>
            <div>
              <span className="text-[#84967c] print:text-gray-500 block">Staff ID / Role:</span>
              <span className="font-bold text-white print:text-black">{currentUser?.staffId || 'N/A'} ({currentUser?.role || 'Clinician'})</span>
            </div>
          </div>

          {/* Section 1: Final Discharge Vitals */}
          <div className="flex flex-col gap-3">
            <h3 className="font-mono text-sm font-bold text-[#02e600] print:text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-[#3b4b35] print:border-gray-300 pb-2">
              <Activity className="w-4 h-4" />
              1. Final Telemetry Vital Signs at Discharge
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 font-mono">
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">SpO2</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.spo2}%</span>
              </div>
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">MAP</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.map} mmHg</span>
              </div>
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">Heart Rate</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.heartRate} bpm</span>
              </div>
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">Resp Rate</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.respirationRate} /min</span>
              </div>
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">Lactate</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.lactate} mmol/L</span>
              </div>
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">Temp</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.temperature}°C</span>
              </div>
              <div className="p-3 bg-[#121414] print:bg-gray-100 rounded-lg border border-[#3b4b35] print:border-gray-300 text-center">
                <span className="text-[10px] text-[#84967c] print:text-gray-500 uppercase block">GCS</span>
                <span className="text-base font-bold text-white print:text-black">{patient.vitals.gcs} / 15</span>
              </div>
            </div>
          </div>

          {/* Section 2: Machine Learning Risk & Explainability */}
          <div className="flex flex-col gap-3">
            <h3 className="font-mono text-sm font-bold text-[#02e600] print:text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-[#3b4b35] print:border-gray-300 pb-2">
              <ShieldCheck className="w-4 h-4" />
              2. XGBoost Deterioration Risk &amp; XAI Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#121414] print:bg-gray-50 rounded-xl border border-[#3b4b35] print:border-gray-300 flex flex-col gap-2">
                <span className="font-mono text-xs text-[#84967c] print:text-gray-500 uppercase font-bold">XGBoost Risk Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-white print:text-black">{currentRisk}%</span>
                  <span className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    currentRisk > 50
                      ? 'bg-red-950/60 text-red-400 print:bg-red-100 print:text-red-800'
                      : currentRisk > 25
                      ? 'bg-amber-950/60 text-amber-400 print:bg-amber-100 print:text-amber-800'
                      : 'bg-emerald-950/60 text-emerald-400 print:bg-emerald-100 print:text-emerald-800'
                  }`}>
                    {currentRisk > 50 ? 'High Risk' : currentRisk > 25 ? 'Moderate Risk' : 'Low Risk / Stable'}
                  </span>
                </div>
                <p className="text-[11px] text-[#b9ccaf] print:text-gray-600 font-sans mt-1">
                  Evaluated using 100 gradient boosted clinical decision trees.
                </p>
              </div>

              <div className="p-4 bg-[#121414] print:bg-gray-50 rounded-xl border border-[#3b4b35] print:border-gray-300 flex flex-col gap-2 col-span-1 md:col-span-2">
                <span className="font-mono text-xs text-[#84967c] print:text-gray-500 uppercase font-bold">TreeSHAP Primary Risk Attributions</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {shapFeatures.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="p-2 bg-[#1a1c1c] print:bg-white rounded border border-[#282a2a] print:border-gray-200 text-xs">
                      <div className="font-mono font-bold text-white print:text-black flex justify-between">
                        <span>{feat.displayName}:</span>
                        <span className={feat.impact > 0 ? 'text-red-400 print:text-red-600' : 'text-emerald-400 print:text-emerald-600'}>
                          {feat.impact > 0 ? '+' : ''}{feat.impact}%
                        </span>
                      </div>
                      <span className="text-[10px] text-[#b9ccaf] print:text-gray-600 block truncate">{feat.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Discharge Notes & Plan */}
          <div className="flex flex-col gap-3">
            <h3 className="font-mono text-sm font-bold text-[#02e600] print:text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-[#3b4b35] print:border-gray-300 pb-2">
              <ClipboardList className="w-4 h-4" />
              3. Clinical Discharge Disposition &amp; Physician Summary
            </h3>

            {/* Editable controls (hidden when printing) */}
            <div className="flex flex-col gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <label className="font-mono text-xs text-[#b9ccaf] font-semibold">Select Discharge Disposition:</label>
                <div className="flex flex-wrap gap-2">
                  {(['Home Discharge', 'Transfer to Ward', 'Step-Down', 'Stable'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDischargeStatus(status)}
                      className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                        dischargeStatus === status
                          ? 'bg-[#02e600] text-[#013a00]'
                          : 'bg-[#121414] text-[#b9ccaf] hover:text-white border border-[#3b4b35]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-[#b9ccaf] font-semibold">Physician &amp; Nursing Summary Notes:</label>
                <textarea
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121414] text-white p-3 rounded-xl border border-[#3b4b35] focus:outline-none focus:border-[#02e600] font-sans text-xs leading-relaxed"
                  placeholder="Enter custom clinical discharge notes..."
                />
              </div>
            </div>

            {/* Print View of Notes */}
            <div className="p-4 bg-[#121414] print:bg-gray-50 border border-[#3b4b35] print:border-gray-300 rounded-xl text-xs font-sans text-white print:text-black leading-relaxed whitespace-pre-wrap">
              <strong className="font-mono text-[#02e600] print:text-emerald-800 block mb-1">
                DISCHARGE NOTES ({dischargeStatus.toUpperCase()}):
              </strong>
              {dischargeNotes}
            </div>
          </div>

          {/* Section 4: Attestation Signatures */}
          <div className="pt-4 border-t border-[#3b4b35] print:border-gray-300 grid grid-cols-2 gap-8 text-xs font-mono">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[#84967c] print:text-gray-500">Attending Physician / Nurse Sign-off:</span>
                <span className="font-bold text-white print:text-black text-sm">{currentUser?.name || 'Staff Clinician'}</span>
                <span className="text-[#b9ccaf] print:text-gray-600 text-[11px]">{currentUser?.roleTitle || 'Authorized ICU Staff'} (ID: {currentUser?.staffId || 'RN-4092'})</span>
              </div>
              <div className="border-b border-dashed border-[#3b4b35] print:border-gray-400 w-full pt-4" />
              <span className="text-[10px] text-[#84967c] print:text-gray-500">Digital Signature / Stamp</span>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[#84967c] print:text-gray-500">Department Authorization:</span>
                <span className="font-bold text-white print:text-black text-sm">ICU Critical Care Unit</span>
                <span className="text-[#b9ccaf] print:text-gray-600 text-[11px]">St. Jude Telemetry Center</span>
              </div>
              <div className="border-b border-dashed border-[#3b4b35] print:border-gray-400 w-full pt-4" />
              <span className="text-[10px] text-[#84967c] print:text-gray-500">Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions (Hidden on print) */}
        <div className="p-4 bg-[#1e2020] border-t border-[#3b4b35] flex items-center justify-between text-xs font-mono text-[#84967c] print:hidden">
          <div className="flex items-center gap-1.5 text-[#02e600]">
            <ShieldCheck className="w-4 h-4" />
            <span>HIPAA Verified Clinical Export</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#252828] hover:bg-[#333535] text-white rounded-xl border border-[#3b4b35] font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#02e600] hover:bg-[#77ff61] text-[#013a00] rounded-xl font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(2,230,0,0.25)] cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
