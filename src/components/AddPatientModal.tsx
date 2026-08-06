import React, { useState } from 'react';
import { Patient, VitalSigns } from '../types';
import { UserPlus, X, Heart, Wind, Activity, Thermometer } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patientData: Partial<Patient>) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(65);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState('Acute Respiratory Deterioration');
  
  const [spo2, setSpo2] = useState(89);
  const [heartRate, setHeartRate] = useState(105);
  const [map, setMap] = useState(78);
  const [respRate, setRespRate] = useState(24);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPatient({
      name: name.toUpperCase() || 'UNKNOWN PATIENT',
      age: Number(age),
      gender,
      admissionDiagnosis,
      vitals: {
        spo2: Number(spo2),
        heartRate: Number(heartRate),
        map: Number(map),
        respRate: Number(respRate),
        temp: 37.8,
        age: Number(age),
        wbc: 12.5,
        lactate: 2.2,
      },
      emrNotes: `Newly admitted ${age}yo ${gender} with ${admissionDiagnosis}. Telemetry initialized.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-sans text-[#e2e2e2]">
      <div className="bg-[#1e2020] border border-[#3b4b35] w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#333535] border-b border-[#3b4b35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#02e600]" />
            <h2 className="font-mono text-base font-bold text-white">Add Patient to Telemetry Bed</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-[#b9ccaf] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 font-mono text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#b9ccaf]">Patient Name</label>
            <input
              type="text"
              required
              placeholder="e.g. DOE, JONATHAN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#121414] text-white p-2.5 rounded border border-[#3b4b35] focus:outline-none focus:border-[#02e600]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#b9ccaf]">Age (years)</label>
              <input
                type="number"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="bg-[#121414] text-white p-2.5 rounded border border-[#3b4b35] focus:outline-none focus:border-[#02e600]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#b9ccaf]">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="bg-[#121414] text-white p-2.5 rounded border border-[#3b4b35] focus:outline-none focus:border-[#02e600]"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#b9ccaf]">Admission Diagnosis</label>
            <input
              type="text"
              value={admissionDiagnosis}
              onChange={(e) => setAdmissionDiagnosis(e.target.value)}
              className="bg-[#121414] text-white p-2.5 rounded border border-[#3b4b35] focus:outline-none focus:border-[#02e600]"
            />
          </div>

          <div className="border-t border-[#3b4b35] pt-3 mt-1 flex flex-col gap-3">
            <span className="text-[#02e600] font-bold uppercase tracking-wider text-[11px]">
              Initial Baseline Vitals
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[#b9ccaf]">SpO2 (%)</label>
                <input
                  type="number"
                  min="60"
                  max="100"
                  value={spo2}
                  onChange={(e) => setSpo2(Number(e.target.value))}
                  className="bg-[#121414] text-white p-2 rounded border border-[#3b4b35]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#b9ccaf]">Heart Rate (bpm)</label>
                <input
                  type="number"
                  min="40"
                  max="180"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="bg-[#121414] text-white p-2 rounded border border-[#3b4b35]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#b9ccaf]">MAP (mmHg)</label>
                <input
                  type="number"
                  min="40"
                  max="140"
                  value={map}
                  onChange={(e) => setMap(Number(e.target.value))}
                  className="bg-[#121414] text-white p-2 rounded border border-[#3b4b35]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#b9ccaf]">Resp Rate (/min)</label>
                <input
                  type="number"
                  min="10"
                  max="40"
                  value={respRate}
                  onChange={(e) => setRespRate(Number(e.target.value))}
                  className="bg-[#121414] text-white p-2 rounded border border-[#3b4b35]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-[#00ff00] text-[#027100] font-bold py-3 rounded-lg hover:bg-[#77ff61] transition-colors cursor-pointer text-sm tracking-wider"
          >
            CONFIRM &amp; ADMIT PATIENT
          </button>
        </form>
      </div>
    </div>
  );
};
