import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Users, 
  Plus, 
  FileText,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useReconciliation } from '../../context/ReconciliationContext';

export const PatientsPage: React.FC = () => {
  const { patients, setSelectedPatientId } = useReconciliation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'All');

  const filterTabs = [
    'All',
    'Needs Review',
    'In Progress',
    'Completed',
    'Admission',
    'Transfer',
    'Discharge'
  ];

  const filteredPatients = patients.filter(patient => {
    // Search filter
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      patient.encounter.toLowerCase().includes(searchFilter.toLowerCase()) ||
      patient.sources.some(s => s.medications.some(m => m.name.toLowerCase().includes(searchFilter.toLowerCase())));

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'All') return true;
    if (activeTab === 'Needs Review') return patient.reconciliationStatus === 'Needs Review';
    if (activeTab === 'In Progress') return patient.reconciliationStatus === 'In Progress';
    if (activeTab === 'Completed') return patient.reconciliationStatus === 'Completed';
    if (activeTab === 'Admission') return patient.encounter.includes('Admission');
    if (activeTab === 'Transfer') return patient.encounter.includes('Transfer');
    if (activeTab === 'Discharge') return patient.encounter.includes('Discharge');

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Patients Registry</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Active inpatient and transition-of-care patient cohort with medication reconciliation status.
          </p>
        </div>

        {/* Demo Tag */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Synthetic Patient Datasets</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, ID, medication..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Encounter</th>
                <th className="py-3.5 px-4">Medications</th>
                <th className="py-3.5 px-4">Discrepancies</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const unreviewed = patient.discrepancies.filter(d => d.status === 'REQUIRES_REVIEW').length;
                  const totalMeds = (patient.sources[0]?.medications.length || 0) + (patient.sources[2]?.medications.length || 0);

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        navigate(`/patients/${patient.id}`);
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors block">
                              {patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{patient.age} yrs • {patient.gender}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {patient.patientId}
                      </td>

                      {/* Encounter */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{patient.encounter}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[150px]" title={patient.attendingPhysician}>
                          Attending: {patient.attendingPhysician}
                        </span>
                      </td>

                      {/* Med Count */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{totalMeds || 6} meds</span>
                        <span className="text-[10px] text-slate-400 block">{patient.sources.length} sources</span>
                      </td>

                      {/* Discrepancies */}
                      <td className="py-3 px-4">
                        {unreviewed > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                            <AlertTriangle size={11} />
                            {unreviewed} issues
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 size={11} />
                            Reconciled
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border ${
                          patient.reconciliationStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          patient.reconciliationStatus === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {patient.reconciliationStatus}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 text-slate-500">
                        {patient.lastUpdated}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(patient.id);
                              navigate(`/patients/${patient.id}`);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            Chart
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(patient.id);
                              navigate(`/reconciliation/${patient.id}`);
                            }}
                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1"
                          >
                            <span>Reconcile</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No matching patients found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria or filter tabs</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
