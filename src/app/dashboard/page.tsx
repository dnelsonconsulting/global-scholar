'use client';

import Link from 'next/link';

export default function StudentDashboard() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Welcome to Your Student Dashboard!</h1>
      <p className="text-gray-600 mb-8">
        Here you can manage your applications, update your profile, and stay up to date with important announcements.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <Link href="/student/applications" className="block bg-blue-50 hover:bg-blue-100 rounded-lg p-6 shadow transition">
          <div className="font-semibold text-lg mb-2">My Applications</div>
          <div className="text-gray-500">View or start a new application</div>
        </Link>
        <Link href="/student/profile" className="block bg-blue-50 hover:bg-blue-100 rounded-lg p-6 shadow transition">
          <div className="font-semibold text-lg mb-2">My Profile</div>
          <div className="text-gray-500">Update your personal information</div>
        </Link>
        <Link href="/student/announcements" className="block bg-blue-50 hover:bg-blue-100 rounded-lg p-6 shadow transition">
          <div className="font-semibold text-lg mb-2">Announcements</div>
          <div className="text-gray-500">See the latest news and updates</div>
        </Link>
        <Link href="/student/support" className="block bg-blue-50 hover:bg-blue-100 rounded-lg p-6 shadow transition">
          <div className="font-semibold text-lg mb-2">Support</div>
          <div className="text-gray-500">Get help or contact support</div>
        </Link>
      </div>
      {/* Optionally, add more sections such as deadlines, progress, or quick links here */}
    </div>
  );
} 