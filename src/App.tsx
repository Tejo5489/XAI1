import React, { useState, useEffect } from 'react';
import { Patient, ViewTab, VitalSigns, ClinicalUser } from './types';
import { getPopulatedPatients } from './data/mockPatients';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { ClinicalView } from './components/ClinicalView';
import { HistoryView } from './components/HistoryView';
import { XAIChatbotDrawer } from './components/XAIChatbotDrawer';
import { AddPatientModal } from './components/AddPatientModal';
import { EditPatientModal } from './components/EditPatientModal';
import { LoginView } from './components/LoginView';
import { DischargeReportModal } from './components/DischargeReportModal';
import {
  calculateRandomForestRisk,
  calculateSHAPValues,
  calculateLIMEExplanations,
  generateRiskNarrative,
  generateRecommendedActions,
} from './utils/rfEngine';

export default function App() {
  const [currentUser, setCurrentUser] = useState<ClinicalUser | null>(() => {
    try {
      const stored = localStorage.getItem('icu_clinical_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [patients, setPatients] = useState<Patient[]>(getPopulatedPatients());
  const [selectedPatientId, setSelectedPatientId] = useState<string>('421A'); // Bed B01 Jonathan Doe
  const [activeTab, setActiveTab] = useState<ViewTab>('risk-analysis');

  const handleLogin = (user: ClinicalUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('icu_clinical_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not store session in localStorage:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('icu_clinical_user');
    } catch (e) {
      console.warn('Could not clear session from localStorage:', e);
    }
  };

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTargetPatient, setEditingTargetPatient] = useState<Patient | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Fetch initial patients from Express API
  useEffect(() => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      })
      .catch((err) => {
        console.warn('Backend API fetch fallback to local mock patients:', err);
      });
  }, []);

  const selectedPatient =
    patients.find((p) => p.id === selectedPatientId || p.patientCode === selectedPatientId) ||
    patients[0] ||
    getPopulatedPatients()[0];

  // Update vitals for a patient and recompute Random Forest risk, SHAP, LIME, Narrative & Actions
  const handleUpdatePatientVitals = (patientId: string, updatedVitals: VitalSigns) => {
    const newRisk = calculateRandomForestRisk(updatedVitals);
    const newShap = calculateSHAPValues(updatedVitals);
    const newLime = calculateLIMEExplanations(updatedVitals);
    const newNarrative = generateRiskNarrative(updatedVitals, newRisk);
    const newActions = generateRecommendedActions(updatedVitals, newRisk);

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId && p.patientCode !== patientId) return p;

        return {
          ...p,
          vitals: updatedVitals,
          currentRisk: newRisk,
          status: newRisk >= 75 ? 'critical' : newRisk >= 40 ? 'warning' : 'stable',
          shapFeatures: newShap,
          limeExplanations: newLime,
          riskNarrative: newNarrative,
          recommendedActions: newActions,
          lastModelUpdate: 'Just now',
          trajectory: [
            ...p.trajectory.slice(0, 3),
            {
              timeLabel: 'Now',
              riskPercentage: newRisk,
              spo2: updatedVitals.spo2,
              map: updatedVitals.map,
              heartRate: updatedVitals.heartRate,
            },
          ],
        };
      })
    );

    // Sync to backend API asynchronously
    fetch(`/api/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vitals: updatedVitals }),
    }).catch(() => {});
  };

  // Update patient metadata (name, diagnosis, age, gender)
  const handleUpdatePatientDetails = (patientId: string, updatedFields: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId && p.patientCode !== patientId) return p;
        return {
          ...p,
          ...updatedFields,
        };
      })
    );

    fetch(`/api/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    }).catch(() => {});
  };

  // Quick rename patient name
  const handleUpdatePatientName = (newName: string) => {
    if (selectedPatient) {
      handleUpdatePatientDetails(selectedPatient.id, { name: newName });
    }
  };

  // Delete / Discharge patient bed
  const handleDeletePatient = (patientId: string) => {
    const updatedList = patients.filter((p) => p.id !== patientId && p.patientCode !== patientId);
    setPatients(updatedList);

    if (selectedPatientId === patientId && updatedList.length > 0) {
      setSelectedPatientId(updatedList[0].id);
    }

    fetch(`/api/patients/${patientId}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  // Add new patient bed handler
  const handleAddPatient = (patientData: Partial<Patient>) => {
    fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    })
      .then((res) => res.json())
      .then((newP) => {
        setPatients((prev) => [...prev, newP]);
        setSelectedPatientId(newP.id);
      })
      .catch(() => {
        // Fallback local addition
        const id = (Math.floor(Math.random() * 800) + 100).toString() + 'X';
        const vitals = patientData.vitals || {
          spo2: 92,
          heartRate: 90,
          map: 80,
          respRate: 20,
          temp: 37.0,
          age: patientData.age || 60,
          wbc: 9.0,
          lactate: 1.5,
        };
        const risk = calculateRandomForestRisk(vitals);
        const shap = calculateSHAPValues(vitals);
        const lime = calculateLIMEExplanations(vitals);
        const actions = generateRecommendedActions(vitals, risk);

        const newP: Patient = {
          id,
          bedNumber: `B0${patients.length + 1}`,
          name: (patientData.name || 'NEW PATIENT').toUpperCase(),
          patientCode: `PATIENT_${id}`,
          age: vitals.age,
          gender: patientData.gender || 'M',
          admissionDiagnosis: patientData.admissionDiagnosis || 'Acute Monitoring',
          status: risk >= 75 ? 'critical' : risk >= 40 ? 'warning' : 'stable',
          vitals,
          trajectory: [
            { timeLabel: '-6h', riskPercentage: Math.max(10, risk - 15), spo2: vitals.spo2 + 3, map: vitals.map + 5, heartRate: vitals.heartRate - 5 },
            { timeLabel: '-4h', riskPercentage: Math.max(10, risk - 10), spo2: vitals.spo2 + 2, map: vitals.map + 2, heartRate: vitals.heartRate - 2 },
            { timeLabel: '-2h', riskPercentage: Math.max(10, risk - 5), spo2: vitals.spo2, map: vitals.map, heartRate: vitals.heartRate },
            { timeLabel: 'Now', riskPercentage: risk, spo2: vitals.spo2, map: vitals.map, heartRate: vitals.heartRate },
          ],
          currentRisk: risk,
          riskNarrative: generateRiskNarrative(vitals, risk),
          lastModelUpdate: 'Just now',
          confidenceScore: 95,
          shapFeatures: shap,
          limeExplanations: lime,
          recommendedActions: actions,
          emrNotes: patientData.emrNotes || 'Newly admitted patient.',
        };

        setPatients((prev) => [...prev, newP]);
        setSelectedPatientId(newP.id);
      });
  };

  const handleOpenChatWithQuery = (query: string) => {
    setChatInitialQuery(query);
    setIsChatDrawerOpen(true);
  };

  const openEditModalForPatient = (p?: Patient) => {
    setEditingTargetPatient(p || selectedPatient);
    setIsEditModalOpen(true);
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#121414] text-[#e2e2e2] font-sans overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => setSelectedPatientId(id)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenEditModal={openEditModalForPatient}
        onDeletePatient={handleDeletePatient}
      />

      {/* Main Container */}
      <div className="pl-72 flex flex-col min-h-screen pb-20">
        {/* Top Header */}
        <Header
          selectedPatient={selectedPatient}
          onOpenChat={() => {
            setChatInitialQuery('');
            setIsChatDrawerOpen(true);
          }}
          onOpenEditModal={() => openEditModalForPatient(selectedPatient)}
          onUpdatePatientName={handleUpdatePatientName}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenExportReport={() => setIsReportModalOpen(true)}
        />

        {/* View Router Main Area */}
        <main className="pt-16 min-h-screen bg-[#121414]">
          {activeTab === 'risk-analysis' && (
            <RiskAnalysisView
              patient={selectedPatient}
              onOpenChatWithQuery={handleOpenChatWithQuery}
              onUpdatePatientVitals={handleUpdatePatientVitals}
            />
          )}

          {activeTab === 'clinical-view' && (
            <ClinicalView
              patient={selectedPatient}
              onOpenChatWithQuery={handleOpenChatWithQuery}
              onOpenExportReport={() => setIsReportModalOpen(true)}
            />
          )}

          {activeTab === 'history' && <HistoryView patient={selectedPatient} />}
        </main>

        {/* Bottom Bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Slide-over XAI Assistant Drawer */}
      <XAIChatbotDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        patient={selectedPatient}
        allPatients={patients}
        onSelectPatient={(id) => setSelectedPatientId(id)}
        initialQuery={chatInitialQuery}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPatient={handleAddPatient}
      />

      {/* Edit Patient Modal */}
      {editingTargetPatient && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          patient={editingTargetPatient}
          onUpdatePatientDetails={handleUpdatePatientDetails}
          onDeletePatient={handleDeletePatient}
        />
      )}

      {/* Discharge / Patient Export Report Modal */}
      <DischargeReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={selectedPatient}
        currentUser={currentUser}
      />
    </div>
  );
}
