import React, { useState } from 'react';
import { ClinicalUser, UserRole } from '../types';
import { ShieldCheck, Stethoscope, Lock, UserCheck, Key, Eye, EyeOff, AlertCircle, Sparkles, Activity } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: ClinicalUser) => void;
}

const PRESET_USERS: ClinicalUser[] = [
  {
    id: 'usr-1',
    name: 'Sarah Jenkins, RN',
    staffId: 'RN-4092',
    role: 'nurse',
    roleTitle: 'ICU Charge Nurse',
    department: 'Cardiac & Telemetry ICU',
    shift: 'Day Shift (07:00 - 19:00)',
    avatarInitials: 'SJ',
  },
  {
    id: 'usr-2',
    name: 'Dr. Marcus Vance, MD',
    staffId: 'MD-1184',
    role: 'doctor',
    roleTitle: 'Attending Intensivist',
    department: 'Critical Care Medicine',
    shift: 'On-Call Attending',
    avatarInitials: 'MV',
  },
  {
    id: 'usr-3',
    name: 'Dr. Elena Rostova, BSN',
    staffId: 'RN-7821',
    role: 'nurse',
    roleTitle: 'Senior Night Shift Nurse',
    department: 'Surgical ICU Telemetry',
    shift: 'Night Shift (19:00 - 07:00)',
    avatarInitials: 'ER',
  },
  {
    id: 'usr-4',
    name: 'Dr. Arthur Chen, MD',
    staffId: 'MD-9012',
    role: 'lead',
    roleTitle: 'ICU Medical Director',
    department: 'Clinical Decision Support',
    shift: 'Department Head',
    avatarInitials: 'AC',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('nurse');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim()) {
      setErrorMsg('Please enter your Medical Staff / Badge ID');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your secure access password');
      return;
    }

    // Role display strings
    const roleTitles: Record<UserRole, string> = {
      nurse: 'Registered Telemetry Nurse',
      doctor: 'Attending Physician / Doctor',
      lead: 'ICU Clinical Lead',
    };

    const newUser: ClinicalUser = {
      id: `usr-${Date.now()}`,
      name: selectedRole === 'doctor' ? `Dr. ${staffId.toUpperCase()}` : `Nurse ${staffId.toUpperCase()}`,
      staffId: staffId.toUpperCase(),
      role: selectedRole,
      roleTitle: roleTitles[selectedRole],
      department: 'ICU Telemetry Unit',
      shift: 'Active Shift',
      avatarInitials: staffId.slice(0, 2).toUpperCase(),
    };

    setErrorMsg('');
    onLogin(newUser);
  };

  const handlePresetSelect = (preset: ClinicalUser) => {
    setStaffId(preset.staffId);
    setPassword('••••••••');
    setSelectedRole(preset.role);
    setErrorMsg('');
    onLogin(preset);
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e2e2e2] flex flex-col justify-center items-center p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Subtle Grid & Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e331a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#02e600]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl bg-[#1a1c1c] border border-[#3b4b35] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col">
        {/* Header Branding */}
        <div className="p-6 md:p-8 bg-[#1e2020] border-b border-[#3b4b35] flex flex-col items-center text-center gap-3">
          <div className="p-3 bg-[#002200] border border-[#02e600]/40 rounded-xl shadow-[0_0_15px_rgba(2,230,0,0.15)]">
            <Activity className="w-8 h-8 text-[#02e600]" />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-mono text-xl md:text-2xl font-bold text-white tracking-tight">
              ICU Clinical Decision Support System
            </h1>
            <p className="font-sans text-xs md:text-sm text-[#b9ccaf]">
              Restricted Access Portal for Authorized Nurses &amp; Physicians
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#121414] px-3 py-1 rounded-full border border-[#3b4b35] font-mono text-[11px] text-[#02e600]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#02e600]" />
            <span>HIPAA Compliant Telemetry Gateway</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 flex flex-col gap-6">
          {/* Quick Preset Accounts Selection */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-[#b9ccaf] font-semibold tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#02e600]" />
                1-Click Quick Staff Login:
              </span>
              <span className="font-mono text-[10px] text-[#84967c]">Select demo profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_USERS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 bg-[#121414] hover:bg-[#252828] border border-[#3b4b35] hover:border-[#02e600] rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#002200] border border-[#02e600]/40 text-[#02e600] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-[#02e600] group-hover:text-[#013a00] transition-colors">
                    {preset.avatarInitials}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-white truncate group-hover:text-[#02e600]">
                      {preset.name}
                    </span>
                    <span className="font-sans text-[11px] text-[#b9ccaf] truncate">
                      {preset.roleTitle}
                    </span>
                    <span className="font-mono text-[10px] text-[#84967c]">
                      ID: {preset.staffId}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 my-1">
            <div className="h-[1px] flex-1 bg-[#3b4b35]" />
            <span className="font-mono text-[11px] text-[#84967c] uppercase">Or Enter Badge Credentials</span>
            <div className="h-[1px] flex-1 bg-[#3b4b35]" />
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-center gap-2.5 text-red-200 text-xs font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Role Tab Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[#b9ccaf] font-medium">Select Medical Role:</label>
              <div className="grid grid-cols-3 gap-2 bg-[#121414] p-1 rounded-xl border border-[#3b4b35]">
                <button
                  type="button"
                  onClick={() => setSelectedRole('nurse')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'nurse'
                      ? 'bg-[#02e600] text-[#013a00] shadow-[0_0_10px_rgba(2,230,0,0.3)]'
                      : 'text-[#b9ccaf] hover:text-white'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Nurse</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('doctor')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'doctor'
                      ? 'bg-[#02e600] text-[#013a00] shadow-[0_0_10px_rgba(2,230,0,0.3)]'
                      : 'text-[#b9ccaf] hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('lead')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'lead'
                      ? 'bg-[#02e600] text-[#013a00] shadow-[0_0_10px_rgba(2,230,0,0.3)]'
                      : 'text-[#b9ccaf] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Lead</span>
                </button>
              </div>
            </div>

            {/* Staff Badge ID */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[#b9ccaf] font-medium flex items-center justify-between">
                <span>Medical Staff / Badge ID:</span>
                <span className="text-[10px] text-[#84967c]">e.g. RN-4092 or MD-1184</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#84967c] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Enter staff badge ID..."
                  className="w-full bg-[#121414] text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#3b4b35] focus:outline-none focus:border-[#02e600] font-mono text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[#b9ccaf] font-medium">Access Code / Password:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#84967c] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121414] text-white pl-9 pr-10 py-2.5 rounded-xl border border-[#3b4b35] focus:outline-none focus:border-[#02e600] font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#84967c] hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center justify-between text-xs font-mono text-[#b9ccaf]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#02e600] rounded cursor-pointer"
                />
                <span>Remember session on this clinical workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-2 w-full py-3 bg-[#02e600] hover:bg-[#77ff61] text-[#013a00] font-mono text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(2,230,0,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>AUTHENTICATE &amp; ENTER TELEMETRY PORTAL</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121414] border-t border-[#3b4b35] flex items-center justify-between text-[11px] font-mono text-[#84967c]">
          <span>ICU Telemetry CDS v2.4</span>
          <span>Encrypted Session Active</span>
        </div>
      </div>
    </div>
  );
};
