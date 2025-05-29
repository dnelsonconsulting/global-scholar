"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye } from "lucide-react";
import { useLookups } from "@/components/hooks/useLookups";
import React from "react";

interface Student {
  id: string;
  school_id: string;
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  additional_name: string;
  date_of_birth: string;
  current_country_id: string;
  is_active: boolean;
}

interface Application {
  id: string;
  student_id: string;
  term_id: string;
  academic_year_id: string;
  status_id: string;
  notes: string;
  created_at: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docStudentId, setDocStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filterAcademicYear, setFilterAcademicYear] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [sortBy, setSortBy] = useState<string>("school_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewAppsStudent, setViewAppsStudent] = useState<Student | null>(null);

  const lookups = useLookups();

  // TODO: Replace with real admin check
  const isAdmin = true;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch students with is_active = true and only required fields
      const { data: studentData } = await supabase
        .from("student")
        .select("id, school_id, user_id, first_name, middle_name, last_name, additional_name, date_of_birth, current_country_id, is_active")
        .eq("is_active", true);
      setStudents(studentData || []);
      // Fetch latest application for each student
      const { data: appData } = await supabase
        .from("application")
        .select("id, student_id, term_id, academic_year_id, status_id, notes, created_at")
        .order("created_at", { ascending: false });
      setApplications(appData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Preprocess applications into a map of latest application by student_id
  const latestAppMap = React.useMemo(() => {
    const map: Record<string, Application> = {};
    applications.forEach(app => {
      if (!map[app.student_id] || new Date(app.created_at) > new Date(map[app.student_id].created_at)) {
        map[app.student_id] = app;
      }
    });
    return map;
  }, [applications]);

  // Helper to get latest application for a student
  const getLatestAppForStudent = (studentId: string) => latestAppMap[studentId];

  // Helper to get country name
  const getCountryName = (countryId: string) =>
    lookups.countries.find((c) => c.id === countryId)?.country_name || "-";

  // Helper to get status name
  const getStatusName = (statusId: string) =>
    lookups.applicationStatuses.find((s) => s.id === statusId)?.status_name || "-";

  // Helper to get term name
  const getTermName = (termId: string) =>
    lookups.terms.find((t) => t.id === termId)?.term_name || "-";

  // Helper to get academic year name
  const getAcademicYearName = (yearId: string) =>
    lookups.academicYears.find((y) => y.id === yearId)?.year_name || "-";

  // Filter and search logic
  const filteredStudents = students.filter((student) => {
    const app = getLatestAppForStudent(student.id);
    // Filter by dropdowns
    if (filterStatus && app?.status_id !== filterStatus) return false;
    if (filterTerm && app?.term_id !== filterTerm) return false;
    if (filterAcademicYear && app?.academic_year_id !== filterAcademicYear) return false;
    if (filterCountry && student.current_country_id !== filterCountry) return false;
    // Search across all fields
    const searchString = [
      student.school_id,
      getTermName(app?.term_id || ""),
      getAcademicYearName(app?.academic_year_id || ""),
      getStatusName(app?.status_id || ""),
      app?.notes || "",
      student.first_name,
      student.middle_name,
      student.last_name,
      student.additional_name,
      student.date_of_birth,
      getCountryName(student.current_country_id)
    ].join(" ").toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  // Sorting logic
  const sortedStudents = React.useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const appA = getLatestAppForStudent(a.id);
      const appB = getLatestAppForStudent(b.id);
      let valA: any = "";
      let valB: any = "";
      switch (sortBy) {
        case "school_id":
          valA = a.school_id; valB = b.school_id; break;
        case "term":
          valA = getTermName(appA?.term_id || ""); valB = getTermName(appB?.term_id || ""); break;
        case "academic_year":
          valA = getAcademicYearName(appA?.academic_year_id || ""); valB = getAcademicYearName(appB?.academic_year_id || ""); break;
        case "status":
          valA = getStatusName(appA?.status_id || ""); valB = getStatusName(appB?.status_id || ""); break;
        case "notes":
          valA = appA?.notes || ""; valB = appB?.notes || ""; break;
        case "first_name":
          valA = a.first_name; valB = b.first_name; break;
        case "middle_name":
          valA = a.middle_name; valB = b.middle_name; break;
        case "last_name":
          valA = a.last_name; valB = b.last_name; break;
        case "additional_name":
          valA = a.additional_name; valB = b.additional_name; break;
        case "date_of_birth":
          valA = a.date_of_birth; valB = b.date_of_birth; break;
        case "current_country":
          valA = getCountryName(a.current_country_id); valB = getCountryName(b.current_country_id); break;
      }
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredStudents, sortBy, sortOrder]);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Helper to render sort arrow
  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? <span> ▲</span> : <span> ▼</span>;
  };

  if (!isAdmin) {
    return <div className="p-8 text-red-600 font-bold">Access denied. Admins only.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Students</h1>
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
          {lookups.applicationStatuses.map(s => (
            <option key={s.id} value={s.id}>{s.status_name}</option>
          ))}
        </select>
        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Terms</option>
          {lookups.terms.map(t => (
            <option key={t.id} value={t.id}>{t.term_name}</option>
          ))}
        </select>
        <select value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Academic Years</option>
          {lookups.academicYears.map(y => (
            <option key={y.id} value={y.id}>{y.year_name}</option>
          ))}
        </select>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Nationalities</option>
          {lookups.countries.map(c => (
            <option key={c.id} value={c.id}>{c.country_name}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("school_id")}>School ID{renderSortArrow("school_id")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("term")}>Term{renderSortArrow("term")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("academic_year")}>Academic Year{renderSortArrow("academic_year")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("status")}>Status{renderSortArrow("status")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("notes")}>Notes{renderSortArrow("notes")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("first_name")}>First Name{renderSortArrow("first_name")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("middle_name")}>Middle Name{renderSortArrow("middle_name")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("last_name")}>Last Name{renderSortArrow("last_name")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("additional_name")}>Additional Name{renderSortArrow("additional_name")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("date_of_birth")}>Date of Birth{renderSortArrow("date_of_birth")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("current_country")}>Current Country{renderSortArrow("current_country")}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("first_name")}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map((student) => {
                const app = getLatestAppForStudent(student.id);
                return (
                  <tr key={student.id}>
                    <td className="px-4 py-2">{student.school_id}</td>
                    <td className="px-4 py-2">{getTermName(app?.term_id || "")}</td>
                    <td className="px-4 py-2">{getAcademicYearName(app?.academic_year_id || "")}</td>
                    <td className="px-4 py-2">{getStatusName(app?.status_id || "")}</td>
                    <td className="px-4 py-2">{app?.notes || '-'}</td>
                    <td className="px-4 py-2">{student.first_name}</td>
                    <td className="px-4 py-2">{student.middle_name}</td>
                    <td className="px-4 py-2">{student.last_name}</td>
                    <td className="px-4 py-2">{student.additional_name}</td>
                    <td className="px-4 py-2">{student.date_of_birth}</td>
                    <td className="px-4 py-2">{getCountryName(student.current_country_id)}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={() => setViewAppsStudent(student)}
                      >
                        View Applications
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side Panel for editing student/application */}
      {showSidePanel && selectedStudent && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowSidePanel(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl p-8 overflow-y-auto z-50">
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            {/* TODO: Add form fields for editing student/application info */}
            <div className="mb-4">Name: {selectedStudent.last_name}, {selectedStudent.first_name}</div>
            {/* Add dropdowns and save logic here */}
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowSidePanel(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Modal for document preview/download */}
      {showDocModal && docStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <h2 className="text-lg font-bold mb-4">Student Documents</h2>
            {/* TODO: Fetch and preview documents for docStudentId */}
            <button className="absolute top-2 right-2" onClick={() => setShowDocModal(false)}>
              Close
            </button>
            <div className="mt-4">Document preview and download UI goes here.</div>
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
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.filter(app => app.student_id === viewAppsStudent.id).map(app => (
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
  );
}
