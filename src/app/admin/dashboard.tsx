import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <ul className="space-y-4">
          <li>
            <Link href="/admin/lookups/status" className="text-blue-600 hover:underline">Manage Status Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/term" className="text-blue-600 hover:underline">Manage Term Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/academic_year" className="text-blue-600 hover:underline">Manage Academic Year Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/academic_level" className="text-blue-600 hover:underline">Manage Academic Level Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/degree_programs" className="text-blue-600 hover:underline">Manage Degree Programs Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/scholarships" className="text-blue-600 hover:underline">Manage Scholarships Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/student_type" className="text-blue-600 hover:underline">Manage Student Type Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/country" className="text-blue-600 hover:underline">Manage Country Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/gender" className="text-blue-600 hover:underline">Manage Gender Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/application_status" className="text-blue-600 hover:underline">Manage Application Status Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/countries" className="text-blue-600 hover:underline">Manage Countries Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/roles" className="text-blue-600 hover:underline">Manage Roles Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/student_location" className="text-blue-600 hover:underline">Manage Student Location Lookup</Link>
          </li>
          <li>
            <Link href="/admin/lookups/user_role" className="text-blue-600 hover:underline">Manage User Role Lookup</Link>
          </li>
          <li>
            <Link href="/admin/students" className="text-blue-600 hover:underline">Manage Students</Link>
          </li>
          <li>
            <Link href="/admin/applications" className="text-blue-600 hover:underline">Manage Applications</Link>
          </li>
        </ul>
      </div>
    </div>
  );
} 