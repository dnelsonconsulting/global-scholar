'use client';

import React from 'react';

interface FormFieldsProps {
  formData: {
    firstName: string;
    middleName: string;
    lastName: string;
    additionalName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    educationLevel: string;
    degree_program_id: string;
    whatsapp?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    additionalName?: string;
    gender?: string;
    dateOfBirth?: string;
    email?: string;
    educationLevel?: string;
    degree_program_id?: string;
    whatsapp?: string;
  };
  genders: { id: string; gender_name: string }[];
}

const FormFields: React.FC<FormFieldsProps> = ({ formData, handleInputChange, errors = {}, genders }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">First Name *</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.firstName ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
        <input
          type="text"
          name="middleName"
          value={formData.middleName}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.middleName ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.middleName && (
          <p className="mt-1 text-sm text-red-600">{errors.middleName}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name *</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.lastName ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Additional Name</label>
        <input
          type="text"
          name="additionalName"
          value={formData.additionalName}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.additionalName ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.additionalName && (
          <p className="mt-1 text-sm text-red-600">{errors.additionalName}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Gender *</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.gender ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        >
          <option value="">Select Gender</option>
          {genders.map(g => (
            <option key={g.id} value={g.id}>{g.gender_name}</option>
          ))}
        </select>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
        <input
          type="text"
          name="whatsapp"
          value={formData.whatsapp || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full px-4 py-3 rounded-md shadow-sm focus:ring-navy-blue focus:border-navy-blue border-gray-300"
          placeholder="e.g. +1234567890"
        />
      </div>
    </div>
  );
};

export default FormFields; 