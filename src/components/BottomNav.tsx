import React from 'react';
import { ViewTab } from '../types';
import { Activity, AlertTriangle, History } from 'lucide-react';

interface BottomNavProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-72 right-0 h-16 bg-[#282a2a] border-t border-[#3b4b35] flex items-center justify-between px-8 z-40 font-mono text-xs text-[#b9ccaf]">
      <div className="flex items-center gap-10">
        {/* Clinical View Tab */}
        <button
          onClick={() => setActiveTab('clinical-view')}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'clinical-view' ? 'text-[#02e600] font-bold' : 'hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="uppercase tracking-wider">Clinical View</span>
        </button>

        {/* Risk Analysis Tab (Default Active) */}
        <button
          onClick={() => setActiveTab('risk-analysis')}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'risk-analysis' ? 'text-[#02e600] font-bold' : 'hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="uppercase tracking-wider">Risk Analysis</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'history' ? 'text-[#02e600] font-bold' : 'hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="uppercase tracking-wider">History</span>
        </button>
      </div>
    </nav>
  );
};
