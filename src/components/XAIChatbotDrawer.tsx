import React, { useState, useRef, useEffect } from 'react';
import { Patient, ChatMessage } from '../types';
import { Bot, X, Send, Sparkles, User, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';

interface XAIChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  allPatients: Patient[];
  onSelectPatient?: (patientId: string) => void;
  initialQuery?: string;
}

export const XAIChatbotDrawer: React.FC<XAIChatbotDrawerProps> = ({
  isOpen,
  onClose,
  patient,
  allPatients,
  onSelectPatient,
  initialQuery,
}) => {
  const criticalCount = allPatients.filter((p) => p.currentRisk > 70).length;
  const warningCount = allPatients.filter((p) => p.currentRisk > 40 && p.currentRisk <= 70).length;
  const highestRiskPatient = [...allPatients].sort((a, b) => b.currentRisk - a.currentRisk)[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcoming initial message on mount/drawer open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'msg-init-unit',
          sender: 'assistant',
          text: `Hello Nurse! I am your Unit-Wide XAI Clinical Safety Assistant. I am monitoring all ${allPatients.length} active beds simultaneously.

Highest Risk Focus: Bed ${highestRiskPatient?.bedNumber || 1} (${highestRiskPatient?.name || 'Patient'}, ${highestRiskPatient?.currentRisk || 0}% Risk).

You can ask me unit-wide questions (e.g. "Which patient is most critical?", "Summarize all active beds") or examine specific bed SHAP/LIME records below.`,
          timestamp: 'Just now',
          suggestedPrompts: [
            'Which patient is at highest risk right now?',
            'Summarize criticality of all active beds',
            'Show all patients with SpO2 below 92%',
            `Explain Bed ${patient.bedNumber} SHAP drivers`,
          ],
        },
      ]);
    }
  }, [isOpen, allPatients.length, patient.bedNumber, patient.name, patient.currentRisk]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle initial query if passed
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          patientContext: patient,
          allPatients: allPatients,
        }),
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Unit analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        references: data.sources || ['TreeSHAP Algorithm', 'ICU Unit Protocol'],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: `Unit Analysis: Out of ${allPatients.length} active beds, ${criticalCount} bed(s) are at critical risk (>70%). Bed ${highestRiskPatient?.bedNumber} (${highestRiskPatient?.name}) has the highest risk score of ${highestRiskPatient?.currentRisk}%. SpO2 (${highestRiskPatient?.vitals.spo2}%) and Lactate (${highestRiskPatient?.vitals.lactate} mmol/L) require urgent bedside attention.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs font-sans">
      <div className="w-full max-w-xl bg-[#1a1c1c] border-l border-[#3b4b35] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 bg-[#333535] border-b border-[#3b4b35] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#002200] rounded-lg border border-[#02e600]/40">
                <Bot className="w-5 h-5 text-[#02e600]" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  Unit XAI Safety Assistant
                </h2>
                <span className="font-mono text-[10px] text-[#02e600] font-semibold">
                  Multi-Patient Telemetry Oversight
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#b9ccaf] hover:text-white rounded-lg bg-[#121414] border border-[#3b4b35] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Unit Status Bar */}
          <div className="flex items-center justify-between bg-[#121414] p-2.5 rounded-lg border border-[#3b4b35] font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#02e600]" />
                {allPatients.length} Active Beds
              </span>
              <span className="text-[#ffb4ab] font-bold">
                {criticalCount} Critical
              </span>
              <span className="text-amber-400 font-bold">
                {warningCount} Elevated
              </span>
            </div>

            <span className="text-[#b9ccaf] text-[10px]">
              Q15M Live Telemetry
            </span>
          </div>

          {/* Quick Bed Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <span className="font-mono text-[10px] text-[#b9ccaf] uppercase tracking-wider flex-shrink-0 mr-1">
              Select Bed:
            </span>
            {allPatients.map((p) => {
              const isSelected = p.id === patient.id;
              const isCrit = p.currentRisk > 70;
              const isWarn = p.currentRisk > 40 && p.currentRisk <= 70;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient && onSelectPatient(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer flex-shrink-0 border ${
                    isSelected
                      ? 'bg-[#02e600] text-[#013a00] border-[#02e600]'
                      : 'bg-[#121414] text-[#e2e2e2] border-[#3b4b35] hover:border-[#02e600]'
                  }`}
                  title={`${p.name} - Bed ${p.bedNumber} (${p.currentRisk}% Risk)`}
                >
                  <span>Bed {p.bedNumber}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCrit
                        ? 'bg-red-500 shadow-[0_0_6px_red]'
                        : isWarn
                        ? 'bg-amber-400'
                        : 'bg-green-500'
                    }`}
                  />
                  <span className="text-[10px] opacity-80">({p.currentRisk}%)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#121414]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[92%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold ${
                    isUser ? 'bg-blue-600 text-white' : 'bg-[#002200] text-[#02e600] border border-[#02e600]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="flex flex-col gap-1.5 max-w-full">
                  <div
                    className={`p-3.5 rounded-xl font-sans text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[#1e2020] text-[#e2e2e2] border border-[#3b4b35] rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Sources / References */}
                  {msg.references && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.references.map((ref) => (
                        <span
                          key={ref}
                          className="font-mono text-[9px] bg-[#1a1c1c] text-[#84967c] px-2 py-0.5 rounded border border-[#3b4b35]"
                        >
                          REF: {ref}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Quick Prompts */}
                  {msg.suggestedPrompts && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <span className="font-mono text-[10px] text-[#b9ccaf] uppercase tracking-wider">
                        Suggested Unit Queries:
                      </span>
                      {msg.suggestedPrompts.map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => handleSendMessage(promptText)}
                          className="text-left font-mono text-[11px] text-[#02e600] bg-[#02e600]/10 hover:bg-[#02e600]/20 p-2 rounded border border-[#02e600]/30 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3 text-[#02e600]" />
                          <span>{promptText}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="font-mono text-[9px] text-[#84967c] px-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-7 h-7 rounded-full bg-[#002200] text-[#02e600] border border-[#02e600] flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-[#1e2020] rounded-xl border border-[#3b4b35] font-mono text-xs text-[#02e600] animate-pulse">
                Analyzing unit-wide telemetry and patient records...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 bg-[#1e2020] border-t border-[#3b4b35] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about unit status, critical beds, or patient records..."
            className="flex-1 bg-[#121414] text-white text-xs px-3 py-2.5 rounded-lg border border-[#3b4b35] focus:outline-none focus:border-[#02e600] font-mono"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="bg-[#02e600] text-[#013a00] p-2.5 rounded-lg font-bold hover:bg-[#77ff61] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
