'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/StudentPortal/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';

interface Application {
  id: string;
  status: {
    id: string;
    status_name: string;
  };
  student_id: string;
  student_type: {
    id: string;
    student_type: string;
  };
  term: {
    id: string;
    term_name: string;
  };
  academic_year: {
    id: string;
    year_name: string;
  };
  academic_level: {
    id: string;
    level_name: string;
  };
  degree_program: {
    id: string;
    program_name: string;
  };
  scholarship?: {
    id: string;
    scholarship_code: string;
    scholarship_name: string;
  };
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-800';
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'ADDITIONAL_INFO':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const DashboardLoading = () => (
  <Layout>
    <div className="p-8 flex flex-col items-center justify-center min-h-[600px] space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch your application data</p>
      </div>
      <div className="w-full max-w-md space-y-2">
        <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-2 bg-gray-200 rounded-full animate-pulse w-5/6 mx-auto"></div>
        <div className="h-2 bg-gray-200 rounded-full animate-pulse w-4/6 mx-auto"></div>
      </div>
    </div>
  </Layout>
);

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { user } = useSupabase();

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.replace('/auth/signin');
          return;
        }
        setUserEmail(session.user?.email || null);
        // Check admin role
        if (session.user) {
          const { data: userRoles, error } = await supabase
            .from('user_role')
            .select('role_id, is_active')
            .eq('user_id', session.user.id)
            .eq('is_active', true);
          if (!error && userRoles && userRoles.length > 0) {
            const roleIds = userRoles.map(ur => ur.role_id);
            const { data: roles, error: rolesError } = await supabase
              .from('roles')
              .select('id, role_name')
              .in('id', roleIds)
              .eq('is_active', true);
            if (!rolesError && roles && roles.some(r => r.role_name === 'admin')) {
              setIsAdmin(true);
            }
          }
        }
        // First get the student record with more detailed logging
        console.log("Fetching student record for user_id:", session.user.id);
        let studentRecord = null;
        const { data: existingStudent, error: studentError } = await supabase
          .from('student')
          .select('id, user_id, email')  // Add more fields to help debug
          .eq('user_id', session.user.id)
          .maybeSingle();  // Use maybeSingle instead of single to avoid 404 errors

        if (studentError) {
          console.error("Error fetching student record:", {
            error: studentError,
            code: studentError.code,
            message: studentError.message,
            details: studentError.details
          });
          return;
        }

        if (!existingStudent) {
          console.error("No student record found for user:", session.user.id);
          // Create a new student record if one doesn't exist
          const { data: newStudent, error: createError } = await supabase
            .from('student')
            .insert([
              {
                user_id: session.user.id,
                email: session.user.email
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error("Error creating student record:", createError);
            return;
          }

          console.log("Created new student record:", newStudent);
          studentRecord = newStudent;
        } else {
          studentRecord = existingStudent;
        }

        if (!studentRecord) {
          console.error("Failed to get or create student record");
          return;
        }

        console.log("Found student record:", studentRecord);

        // First try a simple query to get applications
        console.log("Fetching applications for student_id:", studentRecord.id);
        const { data: applications, error: appError } = await supabase
          .from('application')
          .select('*')
          .eq('student_id', studentRecord.id)
          .order('created_at', { ascending: false });

        if (appError) {
          console.error("Error fetching applications:", {
            error: appError,
            code: appError.code,
            message: appError.message,
            details: appError.details
          });
          return;
        }

        console.log("Found applications:", applications);

        // If we have applications, fetch the related data
        if (applications && applications.length > 0) {
          // Get all the IDs we need
          const statusIds = Array.from(new Set(applications.map(app => app.status_id)));
          const studentTypeIds = Array.from(new Set(applications.map(app => app.student_type_id)));
          const termIds = Array.from(new Set(applications.map(app => app.term_id)));
          const academicYearIds = Array.from(new Set(applications.map(app => app.academic_year_id)));
          const academicLevelIds = Array.from(new Set(applications.map(app => app.academic_level_id)));
          const degreeProgramIds = Array.from(new Set(applications.map(app => app.degree_program_id)));
          const scholarshipIds = Array.from(new Set(applications.map(app => app.scholarship_id)));

          // Fetch all lookup data
          const [
            { data: statuses },
            { data: studentTypes },
            { data: terms },
            { data: academicYears },
            { data: academicLevels },
            { data: degreePrograms },
            { data: scholarships }
          ] = await Promise.all([
            supabase.from('application_status').select('id, status_name').in('id', statusIds),
            supabase.from('student_type').select('id, student_type').in('id', studentTypeIds),
            supabase.from('term').select('id, term_name').in('id', termIds),
            supabase.from('academic_year').select('id, year_name').in('id', academicYearIds),
            supabase.from('academic_level').select('id, level_name').in('id', academicLevelIds),
            supabase.from('degree_programs').select('id, program_name').in('id', degreeProgramIds),
            supabase.from('scholarships').select('id, scholarship_code, scholarship_name').in('id', scholarshipIds)
          ]);

          // Create lookup maps
          const statusMap = new Map(statuses?.map(s => [s.id, s]) || []);
          const studentTypeMap = new Map(studentTypes?.map(st => [st.id, st]) || []);
          const termMap = new Map(terms?.map(t => [t.id, t]) || []);
          const academicYearMap = new Map(academicYears?.map(ay => [ay.id, ay]) || []);
          const academicLevelMap = new Map(academicLevels?.map(al => [al.id, al]) || []);
          const degreeProgramMap = new Map(degreePrograms?.map(dp => [dp.id, dp]) || []);
          const scholarshipMap = new Map(scholarships?.map(s => [s.id, s]) || []);

          // Transform the data
          const transformedData = applications.map(app => ({
            id: app.id,
            created_at: app.created_at,
            status: statusMap.get(app.status_id) || { id: '', status_name: '' },
            student_id: app.student_id,
            student_type: studentTypeMap.get(app.student_type_id) || { id: '', student_type: '' },
            term: termMap.get(app.term_id) || { id: '', term_name: '' },
            academic_year: academicYearMap.get(app.academic_year_id) || { id: '', year_name: '' },
            academic_level: academicLevelMap.get(app.academic_level_id) || { id: '', level_name: '' },
            degree_program: degreeProgramMap.get(app.degree_program_id) || { id: '', program_name: '' },
            scholarship: scholarshipMap.get(app.scholarship_id) || undefined
          }));

          setApplications(transformedData);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Dashboard - Auth error:", error);
        window.location.replace('/auth/signin');
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndRole();
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Applications Dashboard</h1>
            <p className="text-gray-600 mt-1">Signed in as: {userEmail}</p>
          </div>
          <Link
            href="/student/application"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Application
          </Link>
        </div>

        {applications.length > 0 ? (
          <>
            {/* Table for md and up */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Status</th>
                    <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Type</th>
                    <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term Name</th>
                    <th scope="col" className="hidden md:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th scope="col" className="hidden md:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Level</th>
                    <th scope="col" className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degree Program</th>
                    <th scope="col" className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholarship</th>
                    <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app, idx) => (
                    <tr key={app.id} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                      <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status.status_name)}`}>
                          {app.status.status_name || 'Not set'}
                        </span>
                      </td>
                      <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">{app.student_type?.student_type || 'Not set'}</td>
                      <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">{app.term?.term_name || 'Not set'}</td>
                      <td className="hidden md:table-cell px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">{app.academic_year?.year_name || 'Not set'}</td>
                      <td className="hidden md:table-cell px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">{app.academic_level?.level_name || 'Not set'}</td>
                      <td className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">{app.degree_program?.program_name || 'Not set'}</td>
                      <td className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.scholarship ? `${app.scholarship.scholarship_code} - ${app.scholarship.scholarship_name}` : 'Not set'}
                      </td>
                      <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Card layout for mobile */}
            <div className="md:hidden space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status.status_name)}`}>{app.status.status_name || 'Not set'}</span>
                    <span className="text-xs text-gray-500 ml-auto">{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div><span className="font-semibold text-xs text-gray-500">Student Type:</span> <span className="text-sm text-gray-900">{app.student_type?.student_type || 'Not set'}</span></div>
                    <div><span className="font-semibold text-xs text-gray-500">Term:</span> <span className="text-sm text-gray-900">{app.term?.term_name || 'Not set'}</span></div>
                    <div><span className="font-semibold text-xs text-gray-500">Academic Year:</span> <span className="text-sm text-gray-900">{app.academic_year?.year_name || 'Not set'}</span></div>
                    <div><span className="font-semibold text-xs text-gray-500">Academic Level:</span> <span className="text-sm text-gray-900">{app.academic_level?.level_name || 'Not set'}</span></div>
                    <div><span className="font-semibold text-xs text-gray-500">Degree Program:</span> <span className="text-sm text-gray-900">{app.degree_program?.program_name || 'Not set'}</span></div>
                    <div><span className="font-semibold text-xs text-gray-500">Scholarship:</span> <span className="text-sm text-gray-900">{app.scholarship ? `${app.scholarship.scholarship_code} - ${app.scholarship.scholarship_name}` : 'Not set'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new application.</p>
            <div className="mt-6">
              <Link
                href="/student/application"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Application
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.replace('/');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {isAdmin && (
            <div className="bg-blue-100 rounded-xl shadow p-8 mb-6 hover:bg-blue-200 transition cursor-pointer">
              <a href="/admin" className="block h-full w-full">
                <h2 className="text-2xl font-bold mb-2">Admin</h2>
                <p className="text-gray-600">Go to the admin dashboard</p>
              </a>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 