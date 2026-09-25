import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  Pill, 
  Sparkles, 
  FileText, 
  Building2, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

export const TimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients } = useReconciliation();
  const navigate = useNavigate();

  const patient = patients.find(p => p.id === id) || patients[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chronological Audit</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Medication Journey: {patient.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking every prescription event, patient update, admission order, and clinical reconciliation decision.
          </p>
        </div>

        <button
          onClick={() => navigate(`/reconciliation/${patient.id}`)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start md:self-auto"
        >
          <span>Open Reconciliation</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Vertical Timeline Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative pl-6 md:pl-8 border-l-2 border-slate-200 space-y-8 my-2">
          {patient.timeline.map((event, idx) => {
            const isAI = event.type === 'reconciliation';
            const isAdmission = event.type === 'admission';
            const isReview = event.type === 'review';

            return (
              <div key={event.id || idx} className="relative group">
                {/* Node Dot */}
                <div className={`absolute -left-[31px] md:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isReview ? 'bg-emerald-500 text-white' :
                  isAI ? 'bg-brand-600 text-white shadow-sm' :
                  isAdmission ? 'bg-navy-900 text-white' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {isReview ? <CheckCircle2 size={13} /> :
                   isAI ? <Sparkles size={12} /> :
                   isAdmission ? <Building2 size={12} /> :
                   <Pill size={12} />}
                </div>

                {/* Event Content */}
                <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border border-slate-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="text-xs md:text-sm font-bold text-slate-900">{event.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock size={11} /> {event.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{event.description}</p>

                  {event.author && (
                    <div className="mt-2 text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                      <UserCheck size={12} className="text-brand-600" />
                      <span>Recorded by: {event.author}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
