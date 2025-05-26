'use client';
import React, { ReactNode } from 'react';
import Navbar from '../GlobalNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="p-0">{children}</main> {/* Remove pt-8 or any top padding */}
    </div>
  );
}

