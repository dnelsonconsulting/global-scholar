'use client';

import React from 'react';

const GlobalNav: React.FC = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <nav className="bg-primary-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center space-x-3">
            <img src="/logo.png" alt="Miscio Global Scholar Logo" className="h-10 w-10" />
            <span className="text-xl font-bold">Miscio Global Scholar</span>
          </div>
          {/* Hamburger menu for mobile */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-primary-navy hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`h-6 w-6 ${menuOpen ? 'hidden' : 'block'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon */}
              <svg
                className={`h-6 w-6 ${menuOpen ? 'block' : 'hidden'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Desktop menu */}
          <div className="hidden md:flex space-x-4">
            <a href="/student/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-blue hover:text-primary-navy">Dashboard</a>
            <a href="/student/application" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-blue hover:text-primary-navy">Application</a>
            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-blue hover:text-primary-navy">Courses</a>
            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-blue hover:text-primary-navy">Profile</a>
          </div>
        </div>
      </div>
      {/* Mobile menu, show/hide based on menuOpen state */}
      <div className={`md:hidden ${menuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-primary-navy">
          <a href="/student/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-blue hover:text-primary-navy">Dashboard</a>
          <a href="/student/application" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-blue hover:text-primary-navy">Application</a>
          <a href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-blue hover:text-primary-navy">Courses</a>
          <a href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-blue hover:text-primary-navy">Profile</a>
        </div>
      </div>
    </nav>
  );
};

export default GlobalNav; 