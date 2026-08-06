import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { Edit, X, Trash2, Save, UserCheck } from 'lucide-react';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onUpdatePatientDetails: (patientId: string, updatedFields: Partial<Patient>) => void;
  onDeletePatient: (patientId: string) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onUpdatePatientDetails,
  onDeletePatient,
}) => {
  const [name, setName] = useState(patient.name);
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState(patient.admissionDiagnosis);
  const [age, setAge] = useState(patient.age);
  const [gender, setGender] = useState<'M' | 'F'>(patient.gender);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setName(patient.name);
    setAdmissionDiagnosis(patient.admissionDiagnosis);
    setAge(patient.age);
    setGender(patient.gender);
    setShowDeleteConfirm(false);
  }, [patient]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePatientDetails(patient.id, {
      name: name.trim().toUpperCase() || 'UNKNOWN PATIENT',
      admissionDiagnosis: admissionDiagnosis.trim(),
      age: Number(age),
      gender,
      vitals: {
        ...patient.vitals,
        age: Number(age),
      },
    });
    onClose();
  };

  const handleDelete = () => {
    onDeletePatient(patient.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 font-sans text-[#e2e2e2]">
      <div className="bg-[#1e2020] border border-[#3b4b35] w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#333535] border-b border-[#3b4b35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-[#02e600]" />
            <h2 className="font-mono text-base font-bold text-white">
              Edit Patient (Bed {patient.bedNumber})
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-[#b9ccaf] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 font-mono text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#02e600] font-bold uppercase tracking-wider">
              Patient Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DOE, JONATHAN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#121414] text-white p-2.5 rounded border border-[#02e600]/60 focus:outline-none focus:border-[#02e600] text-sm font-bold"
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
              required
              value={admissionDiagnosis}
              onChange={(e) => setAdmissionDiagnosis(e.target.value)}
              className="bg-[#121414] text-white p-2.5 rounded border border-[#3b4b35] focus:outline-none focus:border-[#02e600]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#3b4b35]">
            <button
              type="submit"
              className="flex-1 bg-[#02e600] text-[#013a00] font-bold py-2.5 rounded-lg hover:bg-[#77ff61] transition-colors cursor-pointer text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-[#93000a]/20 text-red-400 border border-[#93000a] px-3 py-2.5 rounded-lg hover:bg-[#93000a]/40 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                title="Discharge / Remove Bed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Discharge</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-[#93000a] text-white font-bold px-3 py-2.5 rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-xs"
                >
                  Confirm Discharge?
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-[#333535] text-[#b9ccaf] px-2 py-2.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
