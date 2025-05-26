import React, { forwardRef } from 'react';

interface CountrySelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  countries: { id: string; country_name: string }[];
}

const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  ({ value, onChange, error, countries }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country of Issue <span className="text-red-500">*</span></label>
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          className={`mt-1 block w-full px-4 py-3 rounded-md shadow-sm border focus:ring-navy-blue focus:border-navy-blue ${error ? 'border-red-300' : 'border-gray-300'}`}
          required
        >
          <option value="">Select country</option>
          {countries.map(country => (
            <option key={country.id} value={country.id}>{country.country_name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Select the country that issued your ID document</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }
);

CountrySelect.displayName = 'CountrySelect';

export default CountrySelect; 