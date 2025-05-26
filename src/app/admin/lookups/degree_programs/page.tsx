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

interface DegreeProgram {
  id: string;
  program_name: string;
  program_code: string;
  level_id: string;
  description: string;
  is_active: boolean;
  div: string;
  degree: string;
  created_at: string;
  updated_at: string;
  academic_level?: {
    level_name: string;
  };
}

interface AcademicLevel {
  id: string;
  level_name: string;
  is_active: boolean;
}

export default function DegreeProgramsLookupAdmin() {
  const [form, setForm] = useState({
    program_name: '',
    program_code: '',
    level_id: '',
    description: '',
    is_active: true,
    div: '',
    degree: '',
  });
  const [programs, setPrograms] = useState<DegreeProgram[]>([]);
  const [levels, setLevels] = useState<AcademicLevel[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchLevels();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchLevels() {
    const { data, error } = await supabase
      .from('academic_level')
      .select('id, level_name, is_active')
      .eq('is_active', true)
      .order('level_name', { ascending: true });
    if (error) setError(error.message);
    setLevels(data || []);
  }

  async function fetchPrograms() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('degree_programs')
      .select(`
        *,
        academic_level:level_id (level_name)
      `)
      .order('program_name', { ascending: true });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    // Sort by academic_level.level_name, then program_name
    const sorted = (data || []).sort((a, b) => {
      const levelA = a.academic_level?.level_name || '';
      const levelB = b.academic_level?.level_name || '';
      if (levelA < levelB) return -1;
      if (levelA > levelB) return 1;
      // If levels are equal, sort by program_name
      return a.program_name.localeCompare(b.program_name);
    });
    setPrograms(sorted);
    setFetching(false);
  }

  async function setActiveStatus(id: string, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('degree_programs')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    fetchPrograms();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!form.program_name || !form.program_code) {
      setError('Program name and code are required!');
      setLoading(false);
      return;
    }
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('degree_programs')
        .update({
          program_name: form.program_name,
          program_code: form.program_code,
          level_id: form.level_id,
          description: form.description,
          is_active: form.is_active,
          div: form.div,
          degree: form.degree,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ program_name: '', program_code: '', level_id: '', description: '', is_active: true, div: '', degree: '' });
        setEditingId(null);
        fetchPrograms();
      }
    } else {
      // Insert
      const { error } = await supabase.from('degree_programs').insert([
        {
          program_name: form.program_name,
          program_code: form.program_code,
          level_id: form.level_id,
          description: form.description,
          is_active: form.is_active,
          div: form.div,
          degree: form.degree,
        },
      ]);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ program_name: '', program_code: '', level_id: '', description: '', is_active: true, div: '', degree: '' });
        fetchPrograms();
      }
    }
  };

  const handleEdit = (id: string) => {
    const program = programs.find((p) => p.id === id);
    if (program) {
      setForm({
        program_name: program.program_name,
        program_code: program.program_code,
        level_id: program.level_id,
        description: program.description,
        is_active: program.is_active,
        div: program.div,
        degree: program.degree,
      });
      setEditingId(id);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setForm({ program_name: '', program_code: '', level_id: '', description: '', is_active: true, div: '', degree: '' });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage Degree Programs Lookup</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <span className="font-semibold">Active Programs</span>
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
            { label: 'Program Name', accessor: 'program_name' },
            { label: 'Program Code', accessor: 'program_code' },
            { label: 'Academic Level', accessor: (row) => row.academic_level?.level_name || 'N/A' },
            { label: 'Description', accessor: 'description' },
            { label: 'Div', accessor: 'div' },
            { label: 'Degree', accessor: 'degree' },
            {
              label: 'Status / Action',
              accessor: (row) => (
                <div className="flex flex-col items-start gap-1">
                  {row.is_active ? (
                    <span className="text-green-600 font-semibold">Active</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                  {row.is_active ? (
                    <button
                      className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                      onClick={() => setActiveStatus(row.id, false)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200"
                      onClick={() => setActiveStatus(row.id, true)}
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={programs}
          loading={fetching}
          error={error}
          getId={(row) => row.id}
          getIsActive={(row) => row.is_active}
          onEdit={handleEdit}
          emptyMessage="No programs found."
        />
        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <div>
            <label className="block font-semibold mb-1">Program Name *</label>
            <input
              type="text"
              name="program_name"
              value={form.program_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Program Code *</label>
            <input
              type="text"
              name="program_code"
              value={form.program_code}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Academic Level *</label>
            <select
              name="level_id"
              value={form.level_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            >
              <option value="">Select a level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.level_name}
                </option>
              ))}
            </select>
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
            <label className="block font-semibold mb-1">Div</label>
            <input
              type="text"
              name="div"
              value={form.div}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Degree</label>
            <input
              type="text"
              name="degree"
              value={form.degree}
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
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Program' : 'Add Program')}
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
              🎉 Program {editingId ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 