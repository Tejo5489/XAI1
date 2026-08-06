import React from 'react';
import { Patient } from '../types';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

interface SidebarProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenAddModal,
  onOpenEditModal,
  onDeletePatient,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#1a1c1c] border-r border-[#3b4b35] z-50 flex flex-col font-sans">
      {/* Top Header */}
      <div className="p-6 border-b border-[#3b4b35] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-[#b9ccaf]">
            UNIT OVERVIEW
          </span>
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#02e600] animate-pulse shadow-[0_0_8px_#02e600]" />
        </div>

        <button
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center gap-2 bg-[#00ff00] text-[#027100] py-3 rounded-lg font-mono text-sm font-semibold hover:bg-[#77ff61] transition-colors cursor-pointer shadow-[0_0_12px_rgba(0,255,0,0.2)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>ADD PATIENT BED</span>
        </button>
      </div>

      {/* Active Beds List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
        <div className="flex items-center justify-between px-4 py-2 font-mono text-xs text-[#b9ccaf] uppercase tracking-wider">
          <span>ACTIVE BEDS</span>
          <span className="bg-[#333535] text-white px-2 py-0.5 rounded font-bold text-[10px]">
            {patients.length} BEDS
          </span>
        </div>

        {patients.map((p) => {
          const isSelected = p.id === selectedPatientId;
          const isCritical = p.status === 'critical';
          const isWarning = p.status === 'warning';

          return (
            <div
              key={p.id}
              className={`group relative w-full flex items-center justify-between px-4 py-3 rounded-md transition-all text-left border-l-2 ${
                isSelected
                  ? 'bg-[#333535] border-[#02e600] text-white shadow-md'
                  : 'border-transparent text-[#b9ccaf] hover:bg-[#282a2a] hover:text-white'
              }`}
            >
              <button
                onClick={() => onSelectPatient(p.id)}
                className="flex-1 flex items-center gap-3 cursor-pointer text-left overflow-hidden pr-2"
              >
                <span className="font-mono font-bold text-lg text-white">
                  {p.bedNumber}
                </span>
                <div className="flex flex-col truncate">
                  <span className="font-mono text-xs font-semibold text-white truncate max-w-[100px]" title={p.name}>
                    {p.name}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold ${
                      isCritical
                        ? 'text-[#ffb4ab]'
                        : isWarning
                        ? 'text-amber-400'
                        : 'text-[#02e600]'
                    }`}
                  >
                    {p.status} ({p.currentRisk}%)
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1.5">
                {/* Action icons shown on hover or when selected */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditModal(p);
                  }}
                  className="opacity-60 group-hover:opacity-100 hover:text-[#02e600] transition-opacity p-1"
                  title="Edit patient name & diagnosis"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                {patients.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePatient(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                    title="Discharge patient bed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Status Dot */}
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isCritical
                      ? 'bg-[#ffb4ab] shadow-[0_0_8px_#ffb4ab]'
                      : isWarning
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-[#02e600] shadow-[0_0_8px_#02e600]'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-[#3b4b35] text-[11px] font-mono text-[#84967c] flex flex-col gap-1 bg-[#121414]">
        <div className="flex justify-between">
          <span>XAI ENGINE:</span>
          <span className="text-[#02e600]">TreeSHAP v2.4</span>
        </div>
        <div className="flex justify-between">
          <span>MODEL:</span>
          <span className="text-white">RandomForest (100 Trees)</span>
        </div>
      </div>
    </aside>
  );
};
