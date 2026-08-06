import React, { useState } from 'react';
import { Patient, ClinicalUser } from '../types';
import { Bot, User, Edit3, Check, X, LogOut, FileText } from 'lucide-react';

interface HeaderProps {
  selectedPatient: Patient;
  onOpenChat: () => void;
  onOpenEditModal: () => void;
  onUpdatePatientName: (newName: string) => void;
  currentUser?: ClinicalUser | null;
  onLogout?: () => void;
  onOpenExportReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPatient,
  onOpenChat,
  onOpenEditModal,
  onUpdatePatientName,
  currentUser,
  onLogout,
  onOpenExportReport,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(selectedPatient.name);

  const getUnitStatusText = () => {
    if (selectedPatient.status === 'critical') return 'UNIT: CRITICAL ALERT';
    if (selectedPatient.status === 'warning') return 'UNIT: ELEVATED RISK';
    return 'UNIT: STABLE';
  };

  const getUnitStatusClass = () => {
    if (selectedPatient.status === 'critical') return 'text-red-400';
    if (selectedPatient.status === 'warning') return 'text-amber-400';
    return 'text-[#02e600]';
  };

  const handleSaveInlineName = () => {
    if (tempName.trim()) {
      onUpdatePatientName(tempName.trim().toUpperCase());
    }
    setIsEditingName(false);
  };

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-[#1e2020]/90 backdrop-blur-md border-b border-[#3b4b35] z-40 flex items-center justify-between px-6 text-[#e2e2e2]">
      {/* Left Info Badges */}
      <div className="flex items-center gap-5 min-w-0 flex-1 mr-4">
        <div className="flex flex-col flex-shrink-0">
          <span className="font-mono text-[10px] text-[#b9ccaf] uppercase tracking-wider">
            Unit Status
          </span>
          <span className={`font-mono text-sm font-semibold ${getUnitStatusClass()}`}>
            {getUnitStatusText()}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-[#3b4b35] flex-shrink-0" />

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#b9ccaf] uppercase tracking-wider">
              Selected Patient
            </span>
            <button
              onClick={onOpenEditModal}
              className="text-[#02e600] hover:text-[#77ff61] transition-colors cursor-pointer flex items-center gap-1 text-[10px] bg-[#02e600]/10 px-1.5 py-0.5 rounded border border-[#02e600]/30 flex-shrink-0"
              title="Edit patient details or discharge bed"
            >
              <Edit3 className="w-3 h-3" />
              <span>EDIT DETAILS</span>
            </button>
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span className="font-mono text-sm font-bold text-white flex-shrink-0">#{selectedPatient.bedNumber}:</span>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineName()}
                className="bg-[#121414] text-white px-2 py-0.5 rounded border border-[#02e600] font-mono text-sm font-bold focus:outline-none w-36"
                autoFocus
              />
              <button
                onClick={handleSaveInlineName}
                className="p-1 bg-[#02e600] text-[#013a00] rounded hover:bg-[#77ff61] cursor-pointer flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 bg-[#333535] text-[#b9ccaf] rounded hover:text-white cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-sm font-medium text-white truncate">
                #{selectedPatient.bedNumber}: <strong className="font-bold text-[#02e600]">{selectedPatient.name}</strong> <span className="text-[#84967c] text-xs">(ID: {selectedPatient.id})</span>
              </span>
              <button
                onClick={() => {
                  setTempName(selectedPatient.name);
                  setIsEditingName(true);
                }}
                className="text-[#84967c] hover:text-[#02e600] transition-colors cursor-pointer p-0.5 flex-shrink-0"
                title="Quick rename patient"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Export Discharge Report Button */}
        {onOpenExportReport && (
          <button
            onClick={onOpenExportReport}
            className="flex items-center gap-2 bg-[#121414] text-[#e2e2e2] border border-[#3b4b35] hover:border-[#02e600] hover:text-[#02e600] px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer whitespace-nowrap"
            title="Export clinical discharge summary report"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">DISCHARGE REPORT</span>
            <span className="md:hidden">REPORT</span>
          </button>
        )}

        {/* XAI Assistant Trigger Button */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 bg-[#02e600]/15 text-[#02e600] border border-[#02e600]/40 px-3 py-1.5 rounded-lg font-mono text-xs hover:bg-[#02e600]/25 transition-all shadow-[0_0_10px_rgba(2,230,0,0.15)] cursor-pointer whitespace-nowrap"
        >
          <Bot className="w-4 h-4 text-[#02e600]" />
          <span>XAI CHAT</span>
        </button>

        {/* User Profile Badge & Logout */}
        {currentUser ? (
          <div className="flex items-center gap-2 bg-[#121414] p-1 pr-2 rounded-xl border border-[#3b4b35]">
            <div className="w-7 h-7 rounded-lg bg-[#002200] border border-[#02e600] text-[#02e600] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
              {currentUser.avatarInitials || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col text-left max-w-[120px] sm:max-w-[160px] min-w-0">
              <span className="font-mono text-xs font-bold text-white truncate">
                {currentUser.name}
              </span>
              <span className="font-mono text-[9px] text-[#02e600] uppercase font-semibold truncate">
                {currentUser.staffId} • {currentUser.role}
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1 text-[#84967c] hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer ml-1"
                title="Sign out of clinical session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#eaffde] text-[#013a00] flex items-center justify-center font-bold font-mono border border-[#02e600] flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    </header>
  );
};
