import Link from 'next/link';

const lookups = [
  { name: 'Country', path: '/admin/lookups/country' },
  { name: 'Academic Level', path: '/admin/lookups/academic_level' },
  { name: 'Academic Year', path: '/admin/lookups/academic_year' },
  { name: 'Degree Programs', path: '/admin/lookups/degree_programs' },
  { name: 'Scholarships', path: '/admin/lookups/scholarships' },
  { name: 'Student Type', path: '/admin/lookups/student_type' },
  { name: 'Term', path: '/admin/lookups/term' },
  { name: 'User Role', path: '/admin/lookups/user_role' },
  { name: 'Application Status', path: '/admin/lookups/application_status' },
  { name: 'Roles', path: '/admin/lookups/roles' },
  { name: 'Student Location', path: '/admin/lookups/student_location' },
];

export default function LookupDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Lookup Tables</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {lookups.map((lookup) => (
            <Link
              key={lookup.path}
              href={lookup.path}
              className="block p-6 bg-gray-100 rounded-lg shadow hover:bg-primary-blue hover:text-white transition-colors"
            >
              <span className="text-lg font-semibold">{lookup.name}</span>
              <span className="block text-sm mt-1">Manage {lookup.name} lookup table</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 