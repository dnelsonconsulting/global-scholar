'use client';

import dynamic from 'next/dynamic';
import Layout from '@/components/StudentPortal/Layout';
import type { ComponentType } from 'react';

// Loading component for the application form
const ApplicationFormLoading = () => (
  <div className="p-8 flex flex-col items-center justify-center min-h-[600px] space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="text-gray-600">Loading application form...</p>
  </div>
);

// Dynamically import the ApplicationForm component with no SSR
const ApplicationForm = dynamic<{}>(
  () => import('@/components/StudentPortal/ApplicationForm').then((mod) => mod.default as ComponentType<{}>),
  { 
    ssr: false,
    loading: () => <ApplicationFormLoading />
  }
);

export default function ApplicationPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-navy mb-8">Student Application</h1>
        <ApplicationForm />
      </div>
    </Layout>
  );
} 