import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, User, ShieldCheck } from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';
import { DDI_DATABASE, findDDI } from '../../data/ddiDatabase';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const FloatingAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { selectedPatient } = useReconciliation();

  // Dynamic greeting that updates when patient changes
  const [messages, setMessages] = useState<Message[]>([]);

  React.useEffect(() => {
    setMessages([
      {
        id: `welcome-${selectedPatient?.id || 'default'}`,
        sender: 'ai',
        text: `Hello Dr. Sharma. I am ReconRx, your medication reconciliation safety copilot. I am currently monitoring records for ${selectedPatient?.name || 'the active patient'} (${selectedPatient?.patientId || ''}). How can I assist your clinical review?`,
        timestamp: 'Just now'
      }
    ]);
  }, [selectedPatient?.id]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = input.toLowerCase();
    setInput('');

    // Dynamic intelligent responder cross-referencing patient record & trained DDI database
    setTimeout(() => {
      let reply = '';

      // Check if user is asking about an interaction between any two drugs
      let foundDDI = null;
      for (const rule of DDI_DATABASE) {
        if (query.includes(rule.drug_a.toLowerCase()) && query.includes(rule.drug_b.toLowerCase())) {
          foundDDI = rule;
          break;
        }
      }

      if (foundDDI) {
        reply = `Critical Interaction Alert (${foundDDI.severity}): ${foundDDI.drug_a} + ${foundDDI.drug_b}.\n• Mechanism: ${foundDDI.mechanism}\n• Clinical Effect: ${foundDDI.clinical_effect}\n• Recommended Management: ${foundDDI.clinical_management}\n• Safer Alternative: ${foundDDI.safer_alternative} (Ref: ${foundDDI.reference})`;
      } else if (selectedPatient && (query.includes('interaction') || query.includes('conflict') || query.includes('ddi'))) {
        const ddiDiscs = selectedPatient.discrepancies.filter(d => d.type === 'DRUG_DRUG_INTERACTION');
        if (ddiDiscs.length > 0) {
          reply = `ReconRx detected ${ddiDiscs.length} interaction conflict(s) for ${selectedPatient.name}:\n` +
            ddiDiscs.map(d => `• ${d.medicationName}: ${d.clinicalExplanation}`).join('\n') +
            `\nRecommended action: ${ddiDiscs[0].suggestedAction}`;
        } else {
          reply = `No drug-drug interactions detected among the active orders for ${selectedPatient.name} against our 80 DrugBank rules.`;
        }
      } else if (query.includes('atorvastatin') || query.includes('omission') || query.includes('statin')) {
        reply = `Regarding Atorvastatin: It was prescribed as 20 mg once daily at bedtime in the previous outpatient record (Sept 22), but is absent from the current admission orders. Statin omission during acute hospital stays can increase cardiovascular vulnerability. Recommended action: Verify with attending physician if it was intentionally held or accidentally omitted.`;
      } else if (query.includes('metformin') || query.includes('dose') || query.includes('frequency')) {
        reply = `Regarding Metformin: Outpatient record shows 500 mg twice daily (total 1000 mg/day). Inpatient order shows 1000 mg once daily. While cumulative daily dose is equal, a single 1000 mg bolus of immediate-release metformin can cause gastrointestinal distress. Please confirm whether an Extended-Release (XR) formulation was intended.`;
      } else if (query.includes('aspirin')) {
        reply = `Aspirin 75 mg once daily was newly initiated upon hospital admission on Sept 25. It was not present in prior records. Verify clinical indication (cardiovascular secondary prevention) and verify patient has no peptic ulcer disease history.`;
      } else if (query.includes('warfarin') || query.includes('ibuprofen')) {
        reply = `Critical DDI Detected (Rule #1): Concomitant Warfarin and Ibuprofen dramatically amplifies gastrointestinal bleeding risk through additive antiplatelet effects and gastric mucosal irritation. Recommended alternative: Acetaminophen (Paracetamol) for analgesia.`;
      } else if (query.includes('allergy') || query.includes('allergies')) {
        reply = `Documented allergies for ${selectedPatient?.name}: ${selectedPatient?.allergies.join(', ') || 'No known drug allergies (NKDA)'}. Always verify cross-reactivity before finalizing discharge orders.`;
      } else if (query.includes('summary') || query.includes('overview') || query.includes('discrepancies')) {
        const unreviewed = selectedPatient?.discrepancies.filter(d => d.status === 'REQUIRES_REVIEW').length || 0;
        reply = `${selectedPatient?.name} currently has ${unreviewed} unresolved discrepancy item(s) requiring clinician review. You can resolve them directly on the Reconciliation Workbench.`;
      } else {
        reply = `ReconRx Clinical Observation for ${selectedPatient?.name || 'patient'}: Reviewing transitions of care records against 80 trained DDI rules and documented allergies (${selectedPatient?.allergies.join(', ') || 'NKDA'}). As a clinical decision-support copilot, final determination rests with the attending medical team.`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 flex items-center space-x-2 px-3.5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-full shadow-elevated border border-brand-500/40 hover:border-brand-400 transition-all group"
        title="Ask ReconRx Copilot"
      >
        <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center">
          <Sparkles size={14} className="text-brand-400 animate-pulse" />
        </div>
        <span className="text-xs font-semibold tracking-wide pr-1">Ask ReconRx</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-18 right-5 z-50 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-navy-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  ReconRx Copilot
                  <span className="text-[9px] px-1.5 py-0.2 bg-brand-500/20 text-brand-300 rounded border border-brand-500/30">CDS</span>
                </h3>
                <p className="text-[10px] text-slate-400">Context: {selectedPatient?.name} ({selectedPatient?.patientId})</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-navy-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => setInput('Why is Atorvastatin flagged?')}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 whitespace-nowrap"
            >
              Why is Atorvastatin flagged?
            </button>
            <button
              onClick={() => setInput('Explain Metformin change')}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 whitespace-nowrap"
            >
              Explain Metformin
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  m.sender === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-brand-600 text-white'
                }`}>
                  {m.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-navy-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}>
                  <p>{m.text}</p>
                  <span className={`block text-[9px] mt-1 ${m.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-2.5 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about medications or interactions..."
                className="flex-1 px-3 py-1.5 bg-slate-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-lg text-xs text-slate-800 focus:outline-hidden"
              />
              <button
                type="submit"
                className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
            <div className="flex items-center justify-center space-x-1 mt-1 text-[9px] text-slate-400">
              <ShieldCheck size={11} className="text-emerald-500" />
              <span>Decision Support only. ReconRx does not prescribe.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
