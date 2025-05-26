'use client';
import React, { useState, useEffect, useRef } from 'react';
import FormFields from './FormFields';
import DocumentUpload from './DocumentUpload';
import CountrySelect from './CountrySelect';
import FileUpload from './FileUpload';
import FileCard from './FileCard';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, version as pdfjsVersion } from 'pdfjs-dist';
import DocumentPreview from '../student-application/DocumentPreview';
import { Button } from '@/components/ui/button';
import { Eye, X, Loader2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useLookups } from '../hooks/useLookups';
import { useRouter } from 'next/navigation';
import Link from "next/link";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary-navy mx-auto mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">{message}</p>
      <p className="text-sm text-gray-600">Please wait while we load your information...</p>
    </div>
  </div>
);

const renderInitializationStatus = () => null;

// Interfaces...

// Stubs for functions...

const ApplicationForm: React.FC = () => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing application form...');
  const [currentStep, setCurrentStep] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    additional_name: '',
    email: '',
    whats_app: '',
    phone: '',
    date_of_birth: '',
    gender_id: '',
    nationality_country_id: '',
    term_id: '',
    academic_year_id: '',
    academic_level_id: '',
    degree_program_id: '',
  });
  const [errors, setErrors] = useState({});
  const lookups = useLookups();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  const [appSaving, setAppSaving] = useState(false);
  const [appSaveError, setAppSaveError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [nationalIdCountry, setNationalIdCountry] = useState('');
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [transcripts, setTranscripts] = useState<{ country: string; file: File | null }[]>([
    { country: '', file: null }
  ]);
  const [docSaving, setDocSaving] = useState(false);
  const [docSaveError, setDocSaveError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveStep1ToSupabase = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setSaveError('User not authenticated.');
        setSaving(false);
        return false;
      }
      // Upsert student record by user_id (only student fields)
      const { error } = await supabase.from('student').upsert([
        {
          user_id: user.id,
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          additional_name: formData.additional_name,
          email: formData.email,
          whats_app: formData.whats_app,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          gender_id: formData.gender_id,
          nationality_country_id: formData.nationality_country_id,
        }
      ], { onConflict: 'user_id' });
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return false;
      }
      setSaving(false);
      return true;
    } catch (err: any) {
      setSaveError(err.message || 'Unknown error');
      setSaving(false);
      return false;
    }
  };

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const success = await saveStep1ToSupabase();
    if (success) setCurrentStep(prev => prev + 1);
  };

  // Fetch student_id after Step 1 save (or on mount if already exists)
  useEffect(() => {
    const fetchStudentId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('student').select('id').eq('user_id', user.id).single();
      if (data && data.id) setStudentId(data.id);
    };
    fetchStudentId();
  }, [currentStep]);

  const saveStep2ToSupabase = async () => {
    setAppSaving(true);
    setAppSaveError(null);
    try {
      if (!studentId) {
        setAppSaveError('Student record not found.');
        setAppSaving(false);
        return false;
      }
      // Check if application exists for this student, term, and academic year
      const { data: existingApp, error: selectError } = await supabase
        .from('application')
        .select('student_id, term_id, academic_year_id')
        .eq('student_id', studentId)
        .eq('term_id', formData.term_id)
        .eq('academic_year_id', formData.academic_year_id)
        .single();
      if (existingApp) {
        // Update existing application
        const { error: updateError } = await supabase
          .from('application')
          .update({
            degree_program_id: formData.degree_program_id,
            academic_level_id: formData.academic_level_id,
            // add other fields as needed
          })
          .eq('student_id', studentId)
          .eq('term_id', formData.term_id)
          .eq('academic_year_id', formData.academic_year_id);
        if (updateError) {
          setAppSaveError(updateError.message);
          setAppSaving(false);
          return false;
        }
      } else {
        // Insert new application
        const { error: insertError } = await supabase
          .from('application')
          .insert([
            {
              student_id: studentId,
              term_id: formData.term_id,
              academic_year_id: formData.academic_year_id,
              degree_program_id: formData.degree_program_id,
              academic_level_id: formData.academic_level_id,
              // add other fields as needed
            }
          ]);
        if (insertError) {
          setAppSaveError(insertError.message);
          setAppSaving(false);
          return false;
        }
      }
      setAppSaving(false);
      return true;
    } catch (err: any) {
      setAppSaveError(err.message || 'Unknown error');
      setAppSaving(false);
      return false;
    }
  };

  // Step 2 Next handler
  const handleStep2Next = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveStep2ToSupabase();
    if (success) setCurrentStep(prev => prev + 1);
  };

  const uploadFileToStorage = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('application.documents').upload(path, file, { upsert: true });
    return error;
  };

  const saveStep3ToSupabase = async () => {
    setDocSaving(true);
    setDocSaveError(null);
    try {
      if (!studentId) {
        setDocSaveError('Student record not found.');
        setDocSaving(false);
        return false;
      }
      // National ID
      let nationalIdStoragePath = '';
      if (nationalIdFile) {
        nationalIdStoragePath = `national_id/${studentId}_${Date.now()}_${nationalIdFile.name}`;
        const error = await uploadFileToStorage(nationalIdFile, nationalIdStoragePath);
        if (error) {
          setDocSaveError('Failed to upload National ID: ' + error.message);
          setDocSaving(false);
          return false;
        }
        const { error: docError } = await supabase.from('application_documents').insert([
          {
            student_id: studentId,
            term_id: formData.term_id,
            academic_year_id: formData.academic_year_id,
            document_type: 'national_id',
            file_name: nationalIdFile.name,
            storage_path: nationalIdStoragePath,
            country_id: nationalIdCountry,
            // add other relevant fields if needed
          }
        ]);
        if (docError) {
          setDocSaveError('Failed to save National ID metadata: ' + docError.message);
          setDocSaving(false);
          return false;
        }
      }
      // Transcripts
      for (const t of transcripts) {
        if (t.file) {
          const transcriptStoragePath = `transcripts/${studentId}_${Date.now()}_${t.file.name}`;
          const error = await uploadFileToStorage(t.file, transcriptStoragePath);
          if (error) {
            setDocSaveError('Failed to upload transcript: ' + error.message);
            setDocSaving(false);
            return false;
          }
          const { error: docError } = await supabase.from('application_documents').insert([
            {
              student_id: studentId,
              term_id: formData.term_id,
              academic_year_id: formData.academic_year_id,
              document_type: 'transcript',
              file_name: t.file.name,
              storage_path: transcriptStoragePath,
              country_id: t.country,
              // add other relevant fields if needed
            }
          ]);
          if (docError) {
            setDocSaveError('Failed to save transcript metadata: ' + docError.message);
            setDocSaving(false);
            return false;
          }
        }
      }
      setDocSaving(false);
      return true;
    } catch (err: any) {
      setDocSaveError(err.message || 'Unknown error');
      setDocSaving(false);
      return false;
    }
  };

  const handleStep3Next = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveStep3ToSupabase();
    if (success) setCurrentStep(prev => prev + 1);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePreview = (file: File) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      if (!studentId) {
        setSubmitError('Student record not found.');
        setSubmitLoading(false);
        return;
      }
      // Update the correct application record (by composite key)
      const { error: updateError } = await supabase
        .from('application')
        .update({ term_condition: true })
        .eq('student_id', studentId)
        .eq('term_id', formData.term_id)
        .eq('academic_year_id', formData.academic_year_id);
      if (updateError) {
        setSubmitError(updateError.message);
        setSubmitLoading(false);
        return;
      }
      setSubmitSuccess(true);
      setSubmitLoading(false);
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1000);
    } catch (err: any) {
      setSubmitError(err.message || 'Unknown error');
      setSubmitLoading(false);
    }
  };

  // useEffects for initialization, localStorage loading, etc...

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-4">
      {isPageLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold text-navy-blue mb-8 text-center">Application Form</h2>
        <div className="mb-8">
          <ol className="flex flex-col sm:flex-row items-center justify-between max-w-2xl mx-auto">
            {[
              { label: 'Personal Info' },
              { label: 'Education Info' },
              { label: 'Documents' },
              { label: 'Review & Submit' },
            ].map((step, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;
              return (
                <li key={step.label} className="flex-1 flex items-center relative">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${isActive ? 'bg-blue-600 border-blue-600 text-white font-bold' : isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`ml-3 text-xs sm:text-sm font-medium ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>{step.label}</span>
                  {idx < 3 && (
                    <div className="hidden sm:block absolute top-1/2 left-full w-full h-0.5 bg-gray-200 z-0 ml-2 mr-2" style={{ zIndex: -1 }}></div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <form className="space-y-8" onSubmit={handleNext}>
            <div className="p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-navy-blue mb-6 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-blue-500 rounded mr-2"></span>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Name</label>
                  <input type="text" name="additional_name" value={formData.additional_name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <input type="text" name="whats_app" value={formData.whats_app} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select name="gender_id" value={formData.gender_id} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]">
                    <option value="">Select Gender</option>
                    {lookups.genders && lookups.genders.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.gender_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <div className="p-[5px]"><CountrySelect
                    value={formData.nationality_country_id}
                    onChange={e => setFormData(prev => ({ ...prev, nationality_country_id: e.target.value }))}
                    countries={lookups.countries}
                  /></div>
                </div>
              </div>
              {saveError && <div className="text-red-600 mt-4 text-base font-medium">{saveError}</div>}
              {saving && <div className="text-blue-600 mt-4 text-base font-medium">Saving...</div>}
            </div>
            <div className="flex justify-end mt-6">
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition w-full sm:w-auto" disabled={saving}>
                {saving ? 'Saving...' : 'Next'}
              </button>
            </div>
          </form>
        )}
        {/* Step 2: Education Info */}
        {currentStep === 2 && (
          <form className="space-y-8" onSubmit={handleStep2Next}>
            <div className="p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-navy-blue mb-6 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-500 rounded mr-2"></span>
                Education Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term</label>
                  <select name="term_id" value={formData.term_id} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]">
                    <option value="">Select Term</option>
                    {lookups.terms && lookups.terms.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.term_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <select name="academic_year_id" value={formData.academic_year_id} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]">
                    <option value="">Select Academic Year</option>
                    {lookups.academicYears && lookups.academicYears.map((y: any) => (
                      <option key={y.id} value={y.id}>{y.year_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Level</label>
                  <select name="academic_level_id" value={formData.academic_level_id} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]">
                    <option value="">Select Academic Level</option>
                    {lookups.academicLevels && lookups.academicLevels.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.level_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Degree Program</label>
                  <select name="degree_program_id" value={formData.degree_program_id} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-[5px]">
                    <option value="">Select Degree Program</option>
                    {lookups.degreePrograms && lookups.degreePrograms.map((dp: any) => (
                      <option key={dp.id} value={dp.id}>{dp.program_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {appSaveError && <div className="text-red-600 mt-4 text-base font-medium">{appSaveError}</div>}
              {appSaving && <div className="text-blue-600 mt-4 text-base font-medium">Saving...</div>}
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
              <button type="button" className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold w-full sm:w-auto" onClick={() => setCurrentStep(prev => prev - 1)} disabled={appSaving}>Back</button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition w-full sm:w-auto" disabled={appSaving}>
                {appSaving ? 'Saving...' : 'Next'}
              </button>
            </div>
          </form>
        )}
        {/* Step 3: Document Uploads */}
        {currentStep === 3 && (
          <form className="space-y-8" onSubmit={handleStep3Next}>
            <div className="p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-navy-blue mb-6 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-purple-500 rounded mr-2"></span>
                Document Uploads
              </h3>
              {/* National ID */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-800 mb-2">National ID Document</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    
                    <div className="p-[5px]"><CountrySelect
                      value={nationalIdCountry}
                      onChange={e => setNationalIdCountry(e.target.value)}
                      countries={lookups.countries}
                    /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload National ID</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => setNationalIdFile(e.target.files?.[0] || null)} />
                    {nationalIdFile && <div className="mt-2 text-sm text-gray-600">Selected: {nationalIdFile.name}</div>}
                  </div>
                </div>
                {/* Document Card */}
                {nationalIdFile && (
                  <div className="flex items-center bg-gray-50 rounded-lg p-4 mt-4 shadow">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
                        <Eye className="w-6 h-6 text-gray-500" />
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">National ID Document</div>
                        <div className="text-xs text-gray-500">{nationalIdFile.type.includes('pdf') ? 'PDF Document' : 'Image'}</div>
                        <div className="text-xs text-gray-400">{nationalIdFile.name}</div>
                      </div>
                    </div>
                    <button type="button" className="mx-2" title="Preview" onClick={() => handlePreview(nationalIdFile)}>
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>
                    <a
                      href={URL.createObjectURL(nationalIdFile)}
                      download={nationalIdFile.name}
                      className="mx-2"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                    </a>
                    <button type="button" className="mx-2" title="Remove" onClick={() => setNationalIdFile(null)}>
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              {/* Transcripts */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Transcript(s)</h4>
                {transcripts.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <div className="p-[5px]"><CountrySelect
                        value={t.country}
                        onChange={e => {
                          const newTranscripts = [...transcripts];
                          newTranscripts[idx].country = e.target.value;
                          setTranscripts(newTranscripts);
                        }}
                        countries={lookups.countries}
                      /></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload Transcript</label>
                      <input type="file" accept=".pdf,image/*" onChange={e => {
                        const newTranscripts = [...transcripts];
                        newTranscripts[idx].file = e.target.files?.[0] || null;
                        setTranscripts(newTranscripts);
                      }} />
                      {t.file && <div className="mt-2 text-sm text-gray-600">Selected: {t.file.name}</div>}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {transcripts.length > 1 && (
                        <button type="button" className="text-red-600 text-xs mr-2" onClick={() => setTranscripts(transcripts.filter((_, i) => i !== idx))}>Remove</button>
                      )}
                    </div>
                    {/* Transcript Document Card */}
                    {t.file && (
                      <div className="col-span-2 flex items-center bg-gray-50 rounded-lg p-4 mt-2 shadow">
                        <div className="flex-1 flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
                            <Eye className="w-6 h-6 text-gray-500" />
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">Transcript Document</div>
                            <div className="text-xs text-gray-500">{t.file.type.includes('pdf') ? 'PDF Document' : 'Image'}</div>
                            <div className="text-xs text-gray-400">{t.file.name}</div>
                          </div>
                        </div>
                        <button type="button" className="mx-2" title="Preview" onClick={() => handlePreview(t.file!)}>
                          <Eye className="w-5 h-5 text-blue-600" />
                        </button>
                        <a
                          href={URL.createObjectURL(t.file)}
                          download={t.file.name}
                          className="mx-2"
                          title="Download"
                        >
                          <Download className="w-5 h-5 text-gray-600" />
                        </a>
                        <button type="button" className="mx-2" title="Remove" onClick={() => {
                          const newTranscripts = [...transcripts];
                          newTranscripts[idx].file = null;
                          setTranscripts(newTranscripts);
                        }}>
                          <X className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" onClick={() => setTranscripts([...transcripts, { country: '', file: null }])}>+ Add Transcript</button>
              </div>
              {docSaveError && <div className="text-red-600 mt-4 text-base font-medium">{docSaveError}</div>}
              {docSaving && <div className="text-blue-600 mt-4 text-base font-medium">Saving...</div>}
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
              <button type="button" className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold w-full sm:w-auto" onClick={() => setCurrentStep(prev => prev - 1)} disabled={docSaving}>Back</button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition w-full sm:w-auto" disabled={docSaving}>
                {docSaving ? 'Saving...' : 'Next'}
              </button>
            </div>
            {/* Preview Modal */}
            {isPreviewOpen && previewFile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
                  <h2 className="text-lg font-bold mb-4">Document Preview</h2>
                  <button className="absolute top-2 right-2" onClick={handleClosePreview}>
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
                    {previewFile.type.includes('pdf') ? (
                      <embed src={URL.createObjectURL(previewFile)} type="application/pdf" width="100%" height="100%" />
                    ) : (
                      <img src={URL.createObjectURL(previewFile)} alt="Preview" className="max-h-full max-w-full" />
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button className="px-4 py-2 bg-gray-200 rounded" onClick={handleClosePreview}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <form className="space-y-8" onSubmit={handleFinalSubmit}>
            <div className="p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-navy-blue mb-8 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-blue-500 rounded mr-2"></span>
                Review & Submit
              </h3>
              {/* Personal Info */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 border-gray-200 flex items-center gap-2">
                  <span className="inline-block w-2 h-4 bg-blue-400 rounded mr-1"></span>
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div><span className="font-medium text-gray-600">First Name:</span> <span className="text-gray-900">{formData.first_name}</span></div>
                  <div><span className="font-medium text-gray-600">Middle Name:</span> <span className="text-gray-900">{formData.middle_name}</span></div>
                  <div><span className="font-medium text-gray-600">Last Name:</span> <span className="text-gray-900">{formData.last_name}</span></div>
                  <div><span className="font-medium text-gray-600">Additional Name:</span> <span className="text-gray-900">{formData.additional_name}</span></div>
                  <div><span className="font-medium text-gray-600">Email:</span> <span className="text-gray-900">{formData.email}</span></div>
                  <div><span className="font-medium text-gray-600">WhatsApp:</span> <span className="text-gray-900">{formData.whats_app}</span></div>
                  <div><span className="font-medium text-gray-600">Phone:</span> <span className="text-gray-900">{formData.phone}</span></div>
                  <div><span className="font-medium text-gray-600">Date of Birth:</span> <span className="text-gray-900">{formData.date_of_birth}</span></div>
                  <div><span className="font-medium text-gray-600">Gender:</span> <span className="text-gray-900">{lookups.genders?.find(g => g.id === formData.gender_id)?.gender_name || ''}</span></div>
                  <div><span className="font-medium text-gray-600">Nationality:</span> <span className="text-gray-900">{lookups.countries?.find(c => c.id === formData.nationality_country_id)?.country_name || ''}</span></div>
                </div>
              </div>
              {/* Education Info */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 border-gray-200 flex items-center gap-2">
                  <span className="inline-block w-2 h-4 bg-green-400 rounded mr-1"></span>
                  Education Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div><span className="font-medium text-gray-600">Term:</span> <span className="text-gray-900">{lookups.terms?.find(t => t.id === formData.term_id)?.term_name || ''}</span></div>
                  <div><span className="font-medium text-gray-600">Academic Year:</span> <span className="text-gray-900">{lookups.academicYears?.find(y => y.id === formData.academic_year_id)?.year_name || ''}</span></div>
                  <div><span className="font-medium text-gray-600">Academic Level:</span> <span className="text-gray-900">{lookups.academicLevels?.find(l => l.id === formData.academic_level_id)?.level_name || ''}</span></div>
                  <div><span className="font-medium text-gray-600">Degree Program:</span> <span className="text-gray-900">{lookups.degreePrograms?.find(dp => dp.id === formData.degree_program_id)?.program_name || ''}</span></div>
                </div>
              </div>
              {/* Documents */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 border-gray-200 flex items-center gap-2">
                  <span className="inline-block w-2 h-4 bg-purple-400 rounded mr-1"></span>
                  Documents
                </h4>
                {/* National ID */}
                {nationalIdFile && (
                  <div className="flex items-center bg-gray-50 rounded-lg p-4 mb-2 shadow-sm border border-gray-100">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <Eye className="w-6 h-6 text-blue-500" />
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">National ID Document</div>
                        <div className="text-xs text-gray-500">{nationalIdFile.type.includes('pdf') ? 'PDF Document' : 'Image'}</div>
                        <div className="text-xs text-gray-400">{nationalIdFile.name}</div>
                      </div>
                    </div>
                    <button type="button" className="mx-2" title="Preview" onClick={() => handlePreview(nationalIdFile)}>
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>
                  </div>
                )}
                {/* Transcripts */}
                {transcripts.map((t, idx) => t.file && (
                  <div key={idx} className="flex items-center bg-gray-50 rounded-lg p-4 mb-2 shadow-sm border border-gray-100">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                        <Eye className="w-6 h-6 text-green-500" />
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">Transcript Document</div>
                        <div className="text-xs text-gray-500">{t.file.type.includes('pdf') ? 'PDF Document' : 'Image'}</div>
                        <div className="text-xs text-gray-400">{t.file.name}</div>
                      </div>
                    </div>
                    <button type="button" className="mx-2" title="Preview" onClick={() => handlePreview(t.file!)}>
                      <Eye className="w-5 h-5 text-green-600" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Terms and Conditions */}
              <div className="mb-8 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 text-navy-blue focus:ring-navy-blue border-gray-300 rounded shadow-sm"
                />
                <span className="text-base text-gray-700">
                  I have read and agree to the <span className="font-semibold text-blue-700">terms and conditions</span>
                </span>
              </div>
              {submitError && <div className="text-red-600 mt-4 text-base font-medium">{submitError}</div>}
              {submitSuccess && <div className="text-green-600 mt-4 text-base font-medium">Application submitted successfully!</div>}
              <div className="flex justify-between mt-8">
                <button type="button" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold" onClick={() => setCurrentStep(prev => prev - 1)} disabled={submitLoading}>Back</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition" disabled={!termsAccepted || submitLoading}>
                  {submitLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ApplicationForm;
