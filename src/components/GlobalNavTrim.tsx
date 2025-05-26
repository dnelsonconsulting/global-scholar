'use client';

import React from 'react';

const GlobalNav: React.FC = () => {
  
  return (
    <nav className="bg-primary-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center space-x-3">
            <img src="/logo.png" alt="Miscio Global Scholar Logo" className="h-10 w-10" />
            <span className="text-xl font-bold">Miscio Global Scholar</span>
          </div>
        </div>
      </div>
    </nav>
  );
};


export default GlobalNav; 