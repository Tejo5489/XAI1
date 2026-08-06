import React from 'react';
import { Patient } from '../types';
import { History, Clock, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';

interface HistoryViewProps {
  patient: Patient;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ patient }) => {
  return (
    <div className="flex flex-col w-full p-8 gap-8 font-sans text-[#e2e2e2]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-[#b9ccaf] uppercase tracking-widest bg-[#282a2a] px-3 py-1 rounded border border-[#3b4b35]/50">
            MODULE: HISTORICAL AUDIT &amp; TRAJECTORY
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#3b4b35] to-transparent" />
        </div>
        <h1 className="font-mono text-3xl font-bold text-white">
          Deterioration Event Log — {patient.name}
        </h1>
        <p className="font-sans text-sm text-[#b9ccaf]">
          Audit trail of telemetry alerts, Random Forest risk recalculations, and TreeSHAP driver shifts.
        </p>
      </div>

      {/* Trajectory Table */}
      <div className="bg-[#1e2020] rounded-xl border border-[#3b4b35] overflow-hidden shadow-md">
        <div className="bg-[#333535] px-6 py-4 border-b border-[#3b4b35] flex items-center justify-between">
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#02e600]" />
            Historical 6-Hour Trajectory Intervals
          </h2>
          <span className="font-mono text-xs text-[#b9ccaf]">TreeSHAP Timestamped History</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#121414] text-[#b9ccaf] border-b border-[#3b4b35] uppercase">
              <tr>
                <th className="p-4">Time Interval</th>
                <th className="p-4">Risk Probability</th>
                <th className="p-4">SpO2 (%)</th>
                <th className="p-4">MAP (mmHg)</th>
                <th className="p-4">Heart Rate (bpm)</th>
                <th className="p-4">Primary SHAP Driver</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282a2a] text-white">
              {patient.trajectory.map((t, idx) => {
                const isRiskHigh = t.riskPercentage >= 70;
                const isRiskWarn = t.riskPercentage >= 40;

                return (
                  <tr key={t.timeLabel} className="hover:bg-[#282a2a]/50 transition-colors">
                    <td className="p-4 font-bold text-cyan-400">{t.timeLabel}</td>
                    <td className="p-4">
                      <span
                        className={`font-bold text-sm px-2.5 py-1 rounded ${
                          isRiskHigh
                            ? 'bg-[#93000a] text-[#ffb4ab]'
                            : isRiskWarn
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-[#002200] text-[#02e600]'
                        }`}
                      >
                        {t.riskPercentage}%
                      </span>
                    </td>
                    <td className="p-4">{t.spo2}%</td>
                    <td className="p-4">{t.map} mmHg</td>
                    <td className="p-4">{t.heartRate} bpm</td>
                    <td className="p-4 text-[#b9ccaf]">
                      {t.spo2 < 92 ? `SpO2 Desaturation (${t.spo2}%)` : 'Normal Vitals Baseline'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`uppercase font-bold text-[10px] ${
                          isRiskHigh
                            ? 'text-[#ffb4ab]'
                            : isRiskWarn
                            ? 'text-amber-400'
                            : 'text-[#02e600]'
                        }`}
                      >
                        {isRiskHigh ? 'CRITICAL' : isRiskWarn ? 'WARNING' : 'STABLE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
