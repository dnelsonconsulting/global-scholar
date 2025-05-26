'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import LookupTable from '@/components/LookupTable';

function LookupNav() {
  return (
    <nav className="flex items-center gap-4 mb-8">
      <Link href="/" className="text-blue-600 hover:underline font-semibold">🏠 Home</Link>
      <span className="text-gray-400">/</span>
      <Link href="/admin/lookups" className="text-blue-600 hover:underline font-semibold">🔙 Lookup Dashboard</Link>
    </nav>
  );
}

interface StudentLocation {
  id: string;
  location_code: string;
  location_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function StudentLocationLookupAdmin() {
  const [form, setForm] = useState({
    location_code: '',
    location_name: '',
    description: '',
    is_active: true,
  });
  const [locations, setLocations] = useState<StudentLocation[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchLocations() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('student_location')
      .select('*')
      .order('location_name', { ascending: true });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    setLocations(data || []);
    setFetching(false);
  }

  async function setActiveStatus(id: string, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('student_location')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    fetchLocations();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!form.location_code || !form.location_name) {
      setError('Location code and name are required!');
      setLoading(false);
      return;
    }
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('student_location')
        .update({
          location_code: form.location_code,
          location_name: form.location_name,
          description: form.description,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ location_code: '', location_name: '', description: '', is_active: true });
        setEditingId('');
        fetchLocations();
      }
    } else {
      // Insert
      const { error } = await supabase.from('student_location').insert([
        {
          location_code: form.location_code,
          location_name: form.location_name,
          description: form.description,
          is_active: form.is_active,
        },
      ]);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ location_code: '', location_name: '', description: '', is_active: true });
        fetchLocations();
      }
    }
  };

  const handleCancelEdit = () => {
    setForm({ location_code: '', location_name: '', description: '', is_active: true });
    setEditingId('');
    setError('');
  };

  const handleEdit = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setForm({
        location_code: loc.location_code,
        location_name: loc.location_name,
        description: loc.description,
        is_active: loc.is_active,
      });
      setEditingId(id);
      setError('');
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage Student Location Lookup</h1>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">Active Locations</span>
          <button
            type="button"
            className="border px-3 py-1 rounded text-sm hover:bg-gray-100"
            onClick={() => setShowInactive((v) => !v)}
          >
            {showInactive ? 'Show Only Active' : 'Show Inactive'}
          </button>
        </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <LookupTable
          columns={[
            { label: 'Location Code', accessor: 'location_code' },
            { label: 'Location Name', accessor: 'location_name' },
            { label: 'Description', accessor: 'description' },
            { label: 'Status', accessor: (row) => row.is_active ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-gray-500">Inactive</span> },
          ]}
          data={locations}
          loading={fetching}
          error={error}
          getId={(row) => row.id}
          getIsActive={(row) => row.is_active}
          onDeactivate={(id) => setActiveStatus(id, false)}
          onReactivate={(id) => setActiveStatus(id, true)}
          onEdit={handleEdit}
          emptyMessage="No locations found."
        />
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">Location Code *</label>
            <input
              type="text"
              name="location_code"
              value={form.location_code}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Location Name *</label>
            <input
              type="text"
              name="location_name"
              value={form.location_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
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
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Location' : 'Add Location')}
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
              🎉 Location {editingId ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
        {/* TODO: List, edit, delete student locations */}
      </div>
    </div>
  );
} 