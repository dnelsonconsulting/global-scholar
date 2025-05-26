'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ApplicationSummaryPage() {
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchApplication() {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not signed in.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        setError('Could not fetch application.');
      } else {
        setApplication(data);
        setApplicationStatus(data.status_id);
      }
      setLoading(false);
    }
    fetchApplication();
  }, []);

  useEffect(() => {
    // Only run after loading application data
    if (applicationStatus && !['DRAFT', 'ADDITIONAL_INFO'].includes(applicationStatus)) {
      // Redirect to summary page if not allowed to edit
      router.push('/student/dashboard');
    }
  }, [applicationStatus, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <Link
          href="/student/dashboard"
          className="inline-block mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-6 text-center">Application Summary</h1>
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-10">{error}</div>
        ) : application ? (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold">Application</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 sm:mt-0">
                <span className="font-medium">Status:</span> {application.status_id}
                <span className="font-medium">Term:</span> {application.term_id}
                <span className="font-medium">Academic Year:</span> {application.academic_year_id}
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><span className="font-medium">First/Given Name:</span> {application.first_name}</div>
              <div><span className="font-medium">Middle Name:</span> {application.middle_name}</div>
              <div><span className="font-medium">Last/Surname:</span> {application.last_name}</div>
              <div><span className="font-medium">Additional Name:</span> {application.additional_name}</div>
              <div><span className="font-medium">Gender:</span> {application.gender_id}</div>
              <div><span className="font-medium">Date of Birth:</span> {application.date_of_birth}</div>
              <div><span className="font-medium">Email:</span> {application.email}</div>
              <div><span className="font-medium">WhatsApp:</span> {application.whatsapp}</div>
            </div>
            <h2 className="text-lg font-semibold mt-6 mb-2">Education</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><span className="font-medium">Education Level:</span> {application.academic_level_id}</div>
              <div><span className="font-medium">Degree Program:</span> {application.degree_program_id}</div>
            </div>
            <h2 className="text-lg font-semibold mt-6 mb-2">Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><span className="font-medium">Submitted At:</span> {application.created_at}</div>
            </div>
            {/* Add more fields as needed */}
          </div>
        ) : (
          <div className="text-center py-10">No application found.</div>
        )}
      </div>
    </div>
  );
} 