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

interface AcademicLevel {
  id: string;
  level_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AcademicLevelLookupAdmin() {
  const [form, setForm] = useState({
    level_name: '',
    is_active: true,
  });
  const [levels, setLevels] = useState<AcademicLevel[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLevels();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchLevels() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('academic_level')
      .select('*')
      .order('level_name', { ascending: true });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    setLevels(data || []);
    setFetching(false);
  }

  async function setActiveStatus(id: string, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('academic_level')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    fetchLevels();
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
    if (!form.level_name) {
      setError('Level name is required!');
      setLoading(false);
      return;
    }
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('academic_level')
        .update({
          level_name: form.level_name,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ level_name: '', is_active: true });
        setEditingId(null);
        fetchLevels();
      }
    } else {
      // Insert
      const { error } = await supabase.from('academic_level').insert([
        {
          level_name: form.level_name,
          is_active: form.is_active,
        },
      ]);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ level_name: '', is_active: true });
        fetchLevels();
      }
    }
  };

  const handleEdit = (id: string) => {
    const level = levels.find((l) => l.id === id);
    if (level) {
      setForm({
        level_name: level.level_name,
        is_active: level.is_active,
      });
      setEditingId(id);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setForm({ level_name: '', is_active: true });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage Academic Level Lookup</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <span className="font-semibold">Active Levels</span>
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
            { label: 'Level Name', accessor: 'level_name' },
            { label: 'Status', accessor: (row) => row.is_active ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-gray-500">Inactive</span> },
          ]}
          data={levels}
          loading={fetching}
          error={error}
          getId={(row) => row.id}
          getIsActive={(row) => row.is_active}
          onDeactivate={(id) => setActiveStatus(id, false)}
          onReactivate={(id) => setActiveStatus(id, true)}
          onEdit={handleEdit}
          emptyMessage="No levels found."
        />
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">Level Name *</label>
            <input
              type="text"
              name="level_name"
              value={form.level_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
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
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Level' : 'Add Level')}
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
              🎉 Level {editingId ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 