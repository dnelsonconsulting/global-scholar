'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

import SignOutButton from '@/components/SignOutButton';
import Link from 'next/link';
import LookupTable from '@/components/LookupTable';

interface Country {
  id: string;
  country_name: string;
  iso_2: string;
  iso_3: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function LookupNav() {
  return (
    <nav className="flex items-center gap-4 mb-8">
      <Link href="/" className="text-blue-600 hover:underline font-semibold">🏠 Home</Link>
      <span className="text-gray-400">/</span>
      <Link href="/admin/lookups" className="text-blue-600 hover:underline font-semibold">🔙 Lookup Dashboard</Link>
    </nav>
  );
}

export default function CountryLookupAdmin() {
  const [form, setForm] = useState({
    country_name: '',
    iso_2: '',
    iso_3: '',
    is_active: true,
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchCountries() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('country')
      .select('*')
      .order('country_name', { ascending: true });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    setCountries(data || []);
    setFetching(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!form.country_name || !form.iso_2 || !form.iso_3) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    if (form.iso_2.length !== 2 || form.iso_3.length !== 3) {
      setError('ISO codes must be correct length (2 and 3).');
      setLoading(false);
      return;
    }
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('country')
        .update({
          country_name: form.country_name,
          iso_2: form.iso_2,
          iso_3: form.iso_3,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ country_name: '', iso_2: '', iso_3: '', is_active: true });
        setEditingId('');
        fetchCountries();
      }
    } else {
      // Insert
      const { error } = await supabase.from('country').insert([
        {
          country_name: form.country_name,
          iso_2: form.iso_2,
          iso_3: form.iso_3,
          is_active: form.is_active,
        },
      ]);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ country_name: '', iso_2: '', iso_3: '', is_active: true });
        fetchCountries();
      }
    }
  };

  const handleCancelEdit = () => {
    setForm({ country_name: '', iso_2: '', iso_3: '', is_active: true });
    setEditingId('');
    setError('');
  };

  async function setActiveStatus(id: string, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('country')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    fetchCountries();
  }

  const handleEdit = (id: string) => {
    const country = countries.find((c) => c.id === id);
    if (country) {
      setForm({
        country_name: country.country_name,
        iso_2: country.iso_2,
        iso_3: country.iso_3,
        is_active: country.is_active,
      });
      setEditingId(id);
      setError('');
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage Country Lookup</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <span className="font-semibold">Active Countries</span>
          <button
            type="button"
            className="border px-3 py-1 rounded text-sm hover:bg-gray-100"
            onClick={() => setShowInactive((v) => !v)}
          >
            {showInactive ? 'Show Only Active' : 'Show Inactive'}
          </button>
        </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {fetching ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <LookupTable
              columns={[
                { label: 'Country Name', accessor: 'country_name' },
                { label: 'ISO 2', accessor: 'iso_2' },
                { label: 'ISO 3', accessor: 'iso_3' },
                { label: 'Status', accessor: (row) => row.is_active ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-gray-500">Inactive</span> },
              ]}
              data={countries}
              loading={fetching}
              error={error}
              getId={(row) => row.id}
              getIsActive={(row) => row.is_active}
              onDeactivate={(id) => setActiveStatus(id, false)}
              onReactivate={(id) => setActiveStatus(id, true)}
              onEdit={handleEdit}
              emptyMessage="No countries found."
            />
          </div>
        )}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">Country Name *</label>
            <input
              type="text"
              name="country_name"
              value={form.country_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1">ISO 2 *</label>
              <input
                type="text"
                name="iso_2"
                value={form.iso_2}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                maxLength={2}
                required
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">ISO 3 *</label>
              <input
                type="text"
                name="iso_3"
                value={form.iso_3}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                maxLength={3}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="mr-2"
              disabled={loading}
            />
            <label className="font-semibold">Active</label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Country' : 'Add Country')}
            </button>
            {editingId && (
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && (
            <div className="text-green-600 mt-2 animate-bounce">
              🎉 Country {editingId ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
        <SignOutButton />
      </div>
    </div>
  );
} 