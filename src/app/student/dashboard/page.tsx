'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/StudentPortal/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Eye } from 'lucide-react';
import { useLookups } from '@/components/hooks/useLookups';

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
  student_location?: {
    id: string;
    location_name: string;
  };
  created_at: string;
  _docCount: number;
  student?: {
    email: string;
    first_name: string;
    last_name: string;
  };
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
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { user } = useSupabase();
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalApp, setDocModalApp] = useState<Application | null>(null);
  const [docModalDocs, setDocModalDocs] = useState<any[]>([]);
  const [docModalLoading, setDocModalLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const lookups = useLookups();
  const [students, setStudents] = useState<any[]>([]);
  const [studentApplications, setStudentApplications] = useState<any[]>([]);
  const [viewAppsStudent, setViewAppsStudent] = useState<any | null>(null);
  // Filters, search, and sorting for admin students table
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [sortBy, setSortBy] = useState('school_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Dashboard: useEffect start");
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
              // Fetch all students
              const fetchStudents = async () => {
                const { data: studentData } = await supabase
                  .from('student')
                  .select('id, school_id, user_id, first_name, middle_name, last_name, additional_name, date_of_birth, current_country_id, is_active')
                  .eq('is_active', true);
                setStudents(studentData || []);
                // Fetch all applications for students
                const { data: appData } = await supabase
                  .from('application')
                  .select('id, student_id, term_id, academic_year_id, status_id, notes, created_at')
                  .order('created_at', { ascending: false });
                setStudentApplications(appData || []);
              };
              fetchStudents();
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
          const studentLocationIds = Array.from(new Set(applications.map(app => app.student_location_id)));

          // Fetch all lookup data
          const [
            { data: statuses },
            { data: studentTypes },
            { data: terms },
            { data: academicYears },
            { data: academicLevels },
            { data: degreePrograms },
            { data: scholarships },
            { data: studentLocations }
          ] = await Promise.all([
            supabase.from('application_status').select('id, status_name').in('id', statusIds),
            supabase.from('student_type').select('id, student_type').in('id', studentTypeIds),
            supabase.from('term').select('id, term_name').in('id', termIds),
            supabase.from('academic_year').select('id, year_name').in('id', academicYearIds),
            supabase.from('academic_level').select('id, level_name').in('id', academicLevelIds),
            supabase.from('degree_programs').select('id, program_name').in('id', degreeProgramIds),
            supabase.from('scholarships').select('id, scholarship_code, scholarship_name').in('id', scholarshipIds),
            supabase.from('student_location').select('id, location_name').in('id', studentLocationIds)
          ]);

          // Create lookup maps
          const statusMap = new Map(statuses?.map(s => [s.id, s]) || []);
          const studentTypeMap = new Map(studentTypes?.map(st => [st.id, st]) || []);
          const termMap = new Map(terms?.map(t => [t.id, t]) || []);
          const academicYearMap = new Map(academicYears?.map(ay => [ay.id, ay]) || []);
          const academicLevelMap = new Map(academicLevels?.map(al => [al.id, al]) || []);
          const degreeProgramMap = new Map(degreePrograms?.map(dp => [dp.id, dp]) || []);
          const scholarshipMap = new Map(scholarships?.map(s => [s.id, s]) || []);
          const studentLocationMap = new Map(studentLocations?.map(l => [l.id, l]) || []);

          // Fetch document counts
          const docCounts = await Promise.all(applications.map(async app => {
            const { count } = await supabase
              .from('application_documents')
              .select('id', { count: 'exact', head: true })
              .eq('student_id', app.student_id)
              .eq('term_id', app.term_id)
              .eq('academic_year_id', app.academic_year_id);
            return count || 0;
          }));

          // Transform the data
          const transformedData = applications.map((app, idx) => ({
            id: app.id,
            created_at: app.created_at,
            status: statusMap.get(app.status_id) || { id: '', status_name: '' },
            student_id: app.student_id,
            student_type: studentTypeMap.get(app.student_type_id) || { id: '', student_type: '' },
            term: termMap.get(app.term_id) || { id: '', term_name: '' },
            academic_year: academicYearMap.get(app.academic_year_id) || { id: '', year_name: '' },
            academic_level: academicLevelMap.get(app.academic_level_id) || { id: '', level_name: '' },
            degree_program: degreeProgramMap.get(app.degree_program_id) || { id: '', program_name: '' },
            scholarship: scholarshipMap.get(app.scholarship_id) || undefined,
            student_location: studentLocationMap.get(app.student_location_id) || { id: '', location_name: '' },
            _docCount: docCounts[idx],
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
    console.log("Dashboard: useEffect end");
  }, []);

  const openDocModal = async (app: Application) => {
    setDocModalApp(app);
    setDocModalOpen(true);
    setDocModalLoading(true);
    setDocModalDocs([]);
    const { data: docs, error } = await supabase
      .from('application_documents')
      .select('*')
      .eq('student_id', app.student_id)
      .eq('term_id', app.term?.id)
      .eq('academic_year_id', app.academic_year?.id);
    setDocModalDocs(docs || []);
    setDocModalLoading(false);
  };

  const closeDocModal = () => {
    setDocModalOpen(false);
    setDocModalApp(null);
    setDocModalDocs([]);
  };

  const hasDocuments = (app: Application) => app._docCount && app._docCount > 0;

  // Helper functions for student table
  const getLatestAppForStudent = (studentId: string) => {
    const apps = studentApplications.filter(app => app.student_id === studentId);
    if (apps.length === 0) return null;
    return apps.reduce((latest, app) => new Date(app.created_at) > new Date(latest.created_at) ? app : latest, apps[0]);
  };
  const getCountryName = (countryId: string) => lookups.countries.find((c: any) => c.id === countryId)?.country_name || '-';
  const getStatusName = (statusId: string) => lookups.applicationStatuses.find((s: any) => s.id === statusId)?.status_name || '-';
  const getTermName = (termId: string) => {
    if (!termId) return '-';
    const found = lookups.terms.find((t: any) => t.id === termId);
    if (found) return found.term_name;
    return termId ? `Unknown (${termId})` : '-';
  };
  const getAcademicYearName = (yearId: string) => lookups.academicYears.find((y: any) => y.id === yearId)?.year_name || '-';

  // Filter and search logic
  const filteredStudents = students.filter((student) => {
    const app = getLatestAppForStudent(student.id);
    if (filterStatus && app?.status_id !== filterStatus) return false;
    if (filterTerm && app?.term_id !== filterTerm) return false;
    if (filterAcademicYear && app?.academic_year_id !== filterAcademicYear) return false;
    if (filterCountry && student.current_country_id !== filterCountry) return false;
    const searchString = [
      student.school_id,
      getTermName(app?.term_id),
      getAcademicYearName(app?.academic_year_id),
      getStatusName(app?.status_id),
      app?.notes || '',
      student.first_name,
      student.middle_name,
      student.last_name,
      student.additional_name,
      student.date_of_birth,
      getCountryName(student.current_country_id)
    ].join(' ').toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  // Sorting logic
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const appA = getLatestAppForStudent(a.id);
    const appB = getLatestAppForStudent(b.id);
    let valA: any = '';
    let valB: any = '';
    switch (sortBy) {
      case 'school_id': valA = a.school_id; valB = b.school_id; break;
      case 'term': valA = getTermName(appA?.term_id); valB = getTermName(appB?.term_id); break;
      case 'academic_year': valA = getAcademicYearName(appA?.academic_year_id); valB = getAcademicYearName(appB?.academic_year_id); break;
      case 'status': valA = getStatusName(appA?.status_id); valB = getStatusName(appB?.status_id); break;
      case 'notes': valA = appA?.notes || ''; valB = appB?.notes || ''; break;
      case 'first_name': valA = a.first_name; valB = b.first_name; break;
      case 'middle_name': valA = a.middle_name; valB = b.middle_name; break;
      case 'last_name': valA = a.last_name; valB = b.last_name; break;
      case 'additional_name': valA = a.additional_name; valB = b.additional_name; break;
      case 'date_of_birth': valA = a.date_of_birth; valB = b.date_of_birth; break;
      case 'current_country': valA = getCountryName(a.current_country_id); valB = getCountryName(b.current_country_id); break;
    }
    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  // Helper to render sort arrow
  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <span> ▲</span> : <span> ▼</span>;
  };

  // Helper functions for sub-table lookups
  const getStudentType = (studentTypeId: string) => lookups.studentTypes?.find((st: any) => st.id === studentTypeId)?.student_type || '-';
  const getLocationCode = (locationId: string) => lookups.studentLocations?.find((l: any) => l.id === locationId)?.location_code || '-';
  const getDegreeProgram = (degreeProgramId: string) => lookups.degreePrograms?.find((dp: any) => dp.id === degreeProgramId)?.program_name || '-';
  const getAcademicLevel = (levelId: string) => lookups.academicLevels?.find((al: any) => al.id === levelId)?.level_name || '-';
  const getScholarship = (scholarshipId: string) => lookups.scholarships?.find((s: any) => s.id === scholarshipId)?.scholarship_code || scholarshipId || '-';

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
                    <th scope="col" className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Location</th>
                    <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
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
                      <td className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">{app.student_location?.location_name || 'Not set'}</td>
                      <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        {hasDocuments(app) ? (
                          <button onClick={() => openDocModal(app)} aria-label="View Documents" title="View Documents" className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-5 h-5" />
                          </button>
                        ) : (
                          <span title="No documents">
                            <Eye className="w-5 h-5 text-gray-400" />
                          </span>
                        )}
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
                    <div><span className="font-semibold text-xs text-gray-500">Student Location:</span> <span className="text-sm text-gray-900">{app.student_location?.location_name || 'Not set'}</span></div>
                  </div>
                  {hasDocuments(app) ? (
                    <button onClick={() => openDocModal(app)} aria-label="View Documents" title="View Documents" className="text-blue-600 hover:text-blue-800 mt-2 self-start">
                      <Eye className="w-5 h-5" />
                    </button>
                  ) : (
                    <span title="No documents" className="mt-2 self-start">
                      <Eye className="w-5 h-5 text-gray-400" />
                    </span>
                  )}
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
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.replace('/');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {isAdmin && students.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">All Students (Admin View)</h2>
            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Statuses</option>
                {lookups.applicationStatuses.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.status_name}</option>
                ))}
              </select>
              <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Terms</option>
                {lookups.terms.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.term_name}</option>
                ))}
              </select>
              <select value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Academic Years</option>
                {lookups.academicYears.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.year_name}</option>
                ))}
              </select>
              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="border rounded px-3 py-2">
                <option value="">All Nationalities</option>
                {lookups.countries.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.country_name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('school_id')}>School ID{renderSortArrow('school_id')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('first_name')}>First Name{renderSortArrow('first_name')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('middle_name')}>Middle Name{renderSortArrow('middle_name')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('last_name')}>Last Name{renderSortArrow('last_name')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('additional_name')}>Additional Name{renderSortArrow('additional_name')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('date_of_birth')}>Date of Birth{renderSortArrow('date_of_birth')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('current_country')}>Current Country{renderSortArrow('current_country')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStudents.map((student) => {
                    const appList = studentApplications.filter(app => app.student_id === student.id);
                    return (
                      <React.Fragment key={student.id}>
                        <tr>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                              className="text-lg text-blue-400 hover:text-blue-600 focus:outline-none"
                              title={expandedStudentId === student.id ? 'Collapse' : 'Expand'}
                            >
                              {expandedStudentId === student.id ? '▼' : '▶'}
                            </button>
                          </td>
                          <td className="px-4 py-2">{student.school_id}</td>
                          <td className="px-4 py-2">{student.first_name}</td>
                          <td className="px-4 py-2">{student.middle_name}</td>
                          <td className="px-4 py-2">{student.last_name}</td>
                          <td className="px-4 py-2">{student.additional_name}</td>
                          <td className="px-4 py-2">{student.date_of_birth}</td>
                          <td className="px-4 py-2">{student.email}</td>
                          <td className="px-4 py-2">{lookups.genders.find((g: any) => g.id === student.gender_id)?.gender_name || '-'}</td>
                          <td className="px-4 py-2">{getCountryName(student.current_country_id)}</td>
                        </tr>
                        {/* DEBUG: Show student.id, all application.student_id values, and number of matches */}
                        <tr>
                          <td colSpan={11} className="bg-yellow-50 text-xs text-gray-700 px-4 py-2">
                            <div><strong>student.id:</strong> {student.id}</div>
                            <div><strong>application.student_id values:</strong> {studentApplications.map(app => app.student_id).join(', ')}</div>
                            <div><strong>Applications found for this student:</strong> {appList.length}</div>
                          </td>
                        </tr>
                        {expandedStudentId === student.id && (
                          <tr>
                            <td colSpan={11} className="bg-gray-50 px-4 py-2">
                              <table className="min-w-full">
                                <thead>
                                  <tr>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Application Status</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Status ID</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Student Type</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Location Code</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Academic Year</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Term</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Degree Program</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Academic Level</th>
                                    <th className="px-2 py-1 text-xs text-gray-500 uppercase">Scholarship ID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {appList.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center text-gray-400 py-2">No applications</td></tr>
                                  ) : appList.map(app => (
                                    <tr key={app.id}>
                                      <td className="px-2 py-1">{getStatusName(app.status_id)}</td>
                                      <td className="px-2 py-1">{app.status_id}</td>
                                      <td className="px-2 py-1">{getStudentType(app.student_type_id)}</td>
                                      <td className="px-2 py-1">{getLocationCode(app.student_location_id)}</td>
                                      <td className="px-2 py-1">{getAcademicYearName(app.academic_year_id)}</td>
                                      <td className="px-2 py-1">{getTermName(app.term_id)}</td>
                                      <td className="px-2 py-1">{getDegreeProgram(app.degree_program_id)}</td>
                                      <td className="px-2 py-1">{getAcademicLevel(app.academic_level_id)}</td>
                                      <td className="px-2 py-1">{getScholarship(app.scholarship_id)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Drawer for all applications of a student */}
        {viewAppsStudent && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setViewAppsStudent(null)} />
            <div className="relative bg-white w-full max-w-2xl h-full shadow-xl p-8 overflow-y-auto z-50">
              <h2 className="text-xl font-bold mb-4">Applications for {viewAppsStudent.last_name}, {viewAppsStudent.first_name}</h2>
              <button className="absolute top-2 right-2 text-lg" onClick={() => setViewAppsStudent(null)}>Close</button>
              <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {studentApplications.filter(app => app.student_id === viewAppsStudent.id).map(app => (
                    <tr key={app.id}>
                      <td className="px-4 py-2">{getTermName(app.term_id)}</td>
                      <td className="px-4 py-2">{getAcademicYearName(app.academic_year_id)}</td>
                      <td className="px-4 py-2">{getStatusName(app.status_id)}</td>
                      <td className="px-4 py-2">{app.notes || '-'}</td>
                      <td className="px-4 py-2">{app.created_at ? new Date(app.created_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeDocModal}>&times;</button>
            <h2 className="text-lg font-bold mb-4">Documents for Application</h2>
            {docModalLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : docModalDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No documents found for this application.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {docModalDocs.map(doc => (
                  <li key={doc.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{doc.document_type.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-xs text-gray-500">{doc.file_name}</div>
                    </div>
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold"
                      onClick={async () => {
                        let url = doc.storage_path;
                        if (!url.startsWith('http')) {
                          // If not a full URL, get a signed URL from Supabase Storage
                          const { data } = await supabase.storage.from('application.documents').createSignedUrl(doc.storage_path, 60);
                          url = data?.signedUrl || '';
                        }
                        setPreviewDoc(doc);
                        setPreviewUrl(url);
                      }}
                    >
                      Preview
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {previewDoc && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}>&times;</button>
            <h2 className="text-lg font-bold mb-4">{previewDoc.document_type.replace('_', ' ').toUpperCase()} Preview</h2>
            <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
              {previewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                <embed src={previewUrl} type="application/pdf" width="100%" height="100%" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-h-full max-w-full" />
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 