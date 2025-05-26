'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LookupTable from '@/components/LookupTable';
import Link from 'next/link';

function LookupNav() {
  return (
    <nav className="flex items-center gap-4 mb-8">
      <Link href="/" className="text-blue-600 hover:underline font-semibold">🏠 Home</Link>
      <span className="text-gray-400">/</span>
      <Link href="/admin/lookups" className="text-blue-600 hover:underline font-semibold">🔙 Lookup Dashboard</Link>
    </nav>
  );
}

interface Scholarship {
  id: string;
  scholarship_name: string;
  scholarship_code: string;
  description: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export default function ScholarshipsLookupAdmin() {
  const [form, setForm] = useState({
    scholarship_name: '',
    scholarship_code: '',
    description: '',
    is_active: true,
    order: 0,
  });
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchScholarships();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchScholarships() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('scholarships')
      .select('*')
      .order('scholarship_name', { ascending: true });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    setScholarships(data || []);
    setFetching(false);
  }

  async function setActiveStatus(id: string, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('scholarships')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    fetchScholarships();
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
        [name]: name === 'order' ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!form.scholarship_name || !form.scholarship_code) {
      setError('Scholarship name and code are required!');
      setLoading(false);
      return;
    }
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('scholarships')
        .update({
          scholarship_name: form.scholarship_name,
          scholarship_code: form.scholarship_code,
          description: form.description,
          is_active: form.is_active,
          order: form.order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ scholarship_name: '', scholarship_code: '', description: '', is_active: true, order: 0 });
        setEditingId(null);
        fetchScholarships();
      }
    } else {
      // Insert
      const { error } = await supabase.from('scholarships').insert([
        {
          scholarship_name: form.scholarship_name,
          scholarship_code: form.scholarship_code,
          description: form.description,
          is_active: form.is_active,
          order: form.order,
        },
      ]);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ scholarship_name: '', scholarship_code: '', description: '', is_active: true, order: 0 });
        fetchScholarships();
      }
    }
  };

  const handleEdit = (id: string) => {
    const scholarship = scholarships.find((s) => s.id === id);
    if (scholarship) {
      setForm({
        scholarship_name: scholarship.scholarship_name,
        scholarship_code: scholarship.scholarship_code,
        description: scholarship.description,
        is_active: scholarship.is_active,
        order: scholarship.order,
      });
      setEditingId(id);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setForm({ scholarship_name: '', scholarship_code: '', description: '', is_active: true, order: 0 });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage Scholarships Lookup</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <span className="font-semibold">Active Scholarships</span>
          <button
            type="button"
            className="border px-3 py-1 rounded text-sm hover:bg-gray-100"
            onClick={() => setShowInactive((v) => !v)}
          >
            {showInactive ? 'Show Only Active' : 'Show Inactive'}
          </button>
        </div>
        <LookupTable
          columns={[
            { label: 'Scholarship Name', accessor: 'scholarship_name' },
            { label: 'Scholarship Code', accessor: 'scholarship_code' },
            { label: 'Description', accessor: 'description' },
            { label: 'Order', accessor: 'order' },
            { label: 'Status', accessor: (row) => row.is_active ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-gray-500">Inactive</span> },
          ]}
          data={scholarships}
          loading={fetching}
          error={error}
          getId={(row) => row.id}
          getIsActive={(row) => row.is_active}
          onDeactivate={(id) => setActiveStatus(id, false)}
          onReactivate={(id) => setActiveStatus(id, true)}
          onEdit={handleEdit}
          emptyMessage="No scholarships found."
        />
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">Scholarship Name *</label>
            <input
              type="text"
              name="scholarship_name"
              value={form.scholarship_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Scholarship Code *</label>
            <input
              type="text"
              name="scholarship_code"
              value={form.scholarship_code}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Order</label>
            <input
              type="number"
              name="order"
              value={form.order}
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
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Scholarship' : 'Add Scholarship')}
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
              🎉 Scholarship {editingId ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
 