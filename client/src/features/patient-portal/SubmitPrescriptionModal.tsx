import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Building2, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  FileText, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { MedicationSource, MedicationItem } from '../../types';
import { extractPrescriptionFromImage } from '../../utils/prescriptionOcr';

const formatDateForInput = (dateStr?: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

interface SubmitPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (source: MedicationSource) => void;
  patientName: string;
  initialSource?: MedicationSource | null;
  mode?: 'create' | 'edit';
}

export const SubmitPrescriptionModal: React.FC<SubmitPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  initialSource,
  mode = 'create'
}) => {
  const [facility, setFacility] = useState('');
  const [prescribedDate, setPrescribedDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [sourceType, setSourceType] = useState<'Previous Prescription' | 'Patient Medication Record'>('Previous Prescription');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // OCR scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');

  // Medication entries
  const [medications, setMedications] = useState<Array<{ name: string; dose: string; frequency: string; route: string }>>([
    { name: '', dose: '', frequency: '', route: 'Oral' }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialSource) {
        setFacility(initialSource.facility || '');
        setPrescribedDate(formatDateForInput(initialSource.date));
        setDoctorName(initialSource.medications[0]?.prescribingDoctor || '');
        setSourceType(initialSource.type === 'Current Hospital Record' ? 'Patient Medication Record' : initialSource.type);
        setNotes('');
        setFileName(initialSource.documentName || '');
        setPreviewUrl(null);
        if (initialSource.medications && initialSource.medications.length > 0) {
          setMedications(initialSource.medications.map(m => ({
            name: m.name,
            dose: m.dose,
            frequency: m.frequency,
            route: m.route || 'Oral'
          })));
        } else {
          setMedications([{ name: '', dose: '', frequency: '', route: 'Oral' }]);
        }
      } else {
        setFacility('');
        setPrescribedDate(new Date().toISOString().split('T')[0]);
        setDoctorName('');
        setSourceType('Previous Prescription');
        setNotes('');
        setFileName('');
        setPreviewUrl(null);
        setMedications([{ name: '', dose: '', frequency: '', route: 'Oral' }]);
      }
      setIsScanning(false);
      setScanProgress(0);
      setScanStatus('');
    }
  }, [isOpen, initialSource]);

  if (!isOpen) return null;

  const handleAddMedicationRow = () => {
    setMedications(prev => [...prev, { name: '', dose: '', frequency: '', route: 'Oral' }]);
  };

  const handleRemoveMedicationRow = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: string, value: string) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      setIsScanning(true);
      setScanProgress(15);
      setScanStatus('Reading prescription image...');

      try {
        const extracted = await extractPrescriptionFromImage(file, (status, progress) => {
          setScanStatus(status);
          setScanProgress(progress);
        });

        if (extracted.facility) {
          setFacility(extracted.facility);
        }
        if (extracted.prescribingDoctor) {
          setDoctorName(extracted.prescribingDoctor);
        }
        if (extracted.prescribedDate) {
          setPrescribedDate(extracted.prescribedDate);
        }
        if (extracted.diagnosis) {
          setNotes(`Diagnosis: ${extracted.diagnosis}`);
        }
        if (extracted.medications && extracted.medications.length > 0) {
          setMedications(extracted.medications);
        }
      } catch (err) {
        console.error('Prescription OCR extraction error:', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility.trim()) return;

    const formattedMeds: MedicationItem[] = medications
      .filter(m => m.name.trim().length > 0)
      .map((m, idx) => ({
        id: (initialSource && initialSource.medications[idx]?.id) || `med-pat-${Date.now()}-${idx}`,
        name: m.name,
        dose: m.dose || 'Standard dose',
        frequency: m.frequency || 'Once daily',
        route: m.route || 'Oral',
        source: sourceType,
        prescribedDate,
        prescribingDoctor: doctorName || 'Physician',
        status: 'Active'
      }));

    const resultSource: MedicationSource = {
      id: initialSource ? initialSource.id : `src-${Date.now()}`,
      type: sourceType,
      date: new Date(prescribedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      medicationCount: formattedMeds.length,
      status: initialSource ? initialSource.status : 'Needs Ingestion',
      facility: facility.trim(),
      documentName: fileName || (initialSource?.documentName || 'Uploaded_Prescription_Document.pdf'),
      medications: formattedMeds
    };

    onSubmit(resultSource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
              {mode === 'edit' ? <FileText size={20} /> : <Upload size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'edit' ? 'Edit Recorded Prescription' : 'Submit Medical Prescription / Record'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'edit'
                  ? `Editing record for ${patientName} • Changes will update clinical reconciliation`
                  : `For patient: ${patientName} • Records will route to clinical team for reconciliation`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* File Upload Box with OCR Scanning Feedback */}
          {isScanning ? (
            <div className="border-2 border-brand-500 bg-brand-50/60 rounded-2xl p-5 text-center space-y-3 animate-pulse">
              <div className="flex items-center justify-center space-x-2 text-brand-800 font-semibold text-xs">
                <Sparkles size={16} className="text-brand-600 animate-spin" />
                <span>{scanStatus || 'AI Vision OCR Digitizing Prescription...'}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden max-w-md mx-auto">
                <div 
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block">
                Reading hospital name, prescribing doctor, and prescribed medication lines...
              </span>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-4 text-center bg-slate-50/60 transition-colors">
              {previewUrl && (
                <div className="mb-3 flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Prescription preview" 
                    className="max-h-36 rounded-lg border border-slate-200 object-contain shadow-xs" 
                  />
                </div>
              )}
              <Upload size={22} className="mx-auto text-slate-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-800 block">
                {fileName 
                  ? `${mode === 'edit' ? 'Current Prescription Document: ' : 'Uploaded: '}${fileName}` 
                  : (mode === 'edit' ? 'Upload New Prescription Photo (Optional)' : 'Upload Prescription Scan or Photo (JPG / PNG / PDF)')}
              </span>
              <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
                {fileName 
                  ? (mode === 'edit' ? '✓ You can keep this record or upload a new photo to re-extract' : '✓ OCR Successfully Extracted Hospital & Medicines') 
                  : 'ReconRx OCR automatically digitizes hospital name, doctor, and medicines'}
              </span>
              <label className="mt-2.5 inline-block px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs">
                <span>{fileName ? 'Replace / Re-scan Prescription' : 'Browse Prescription Photo'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Facility & Doctor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital / Clinic / Pharmacy Name *</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital, City Clinic"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Prescription / Visit</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={prescribedDate}
                  onChange={(e) => setPrescribedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prescribing Doctor Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Deshmukh"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Record Category</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-brand-500"
              >
                <option value="Previous Prescription">Previous Prescription (Hospital / Clinic)</option>
                <option value="Patient Medication Record">Patient Self-Reported Medications</option>
              </select>
            </div>
          </div>

          {/* List of Medications on Prescription */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Medications on this Prescription</h4>
                <p className="text-[11px] text-slate-500">List the drugs specified on your prescription</p>
              </div>
              <button
                type="button"
                onClick={handleAddMedicationRow}
                className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={13} />
                <span>Add Drug</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {medications.map((med, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Medication name (e.g. Metformin)"
                      value={med.name}
                      onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Dose (e.g. 500 mg)"
                      value={med.dose}
                      onChange={(e) => handleMedChange(index, 'dose', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Frequency (e.g. Once daily)"
                      value={med.frequency}
                      onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicationRow(index)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Safety Message */}
          <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl text-[11px] text-brand-950 flex items-start space-x-2">
            <Sparkles size={15} className="text-brand-600 flex-shrink-0 mt-0.5" />
            <p>
              Once submitted, your hospital records will be compared against previous therapies by the clinical pharmacy team to check for omissions, dosage discrepancies, and interactions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 size={14} />
              <span>{mode === 'edit' ? 'Save Prescription Changes' : 'Submit to Hospital for Reconciliation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
