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

interface StudentType {
  id: string;
  student_code: string;
  student_type: string;
  description: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export default function StudentTypeLookupAdmin() {
  const [form, setForm] = useState({
    student_code: '',
    student_type: '',
    description: '',
    is_active: true,
    order: 0,
  });
  const [types, setTypes] = useState<StudentType[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTypes();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchTypes() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('student_type')
      .select('*')
      .order('student_type', { ascending: true });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    setTypes(data || []);
    setFetching(false);
  }

  async function setActiveStatus(id: string, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('student_type')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    fetchTypes();
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
    if (!form.student_code || !form.student_type) {
      setError('Student code and type are required!');
      setLoading(false);
      return;
    }
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('student_type')
        .update({
          student_code: form.student_code,
          student_type: form.student_type,
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
        setForm({ student_code: '', student_type: '', description: '', is_active: true, order: 0 });
        setEditingId(null);
        fetchTypes();
      }
    } else {
      // Insert
      const { error } = await supabase.from('student_type').insert([
        {
          student_code: form.student_code,
          student_type: form.student_type,
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
        setForm({ student_code: '', student_type: '', description: '', is_active: true, order: 0 });
        fetchTypes();
      }
    }
  };

  const handleEdit = (id: string) => {
    const type = types.find((t) => t.id === id);
    if (type) {
      setForm({
        student_code: type.student_code,
        student_type: type.student_type,
        description: type.description,
        is_active: type.is_active,
        order: type.order,
      });
      setEditingId(id);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setForm({ student_code: '', student_type: '', description: '', is_active: true, order: 0 });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage Student Type Lookup</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <span className="font-semibold">Active Student Types</span>
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
            { label: 'Student Code', accessor: 'student_code' },
            { label: 'Student Type', accessor: 'student_type' },
            { label: 'Description', accessor: 'description' },
            { label: 'Order', accessor: 'order' },
            { label: 'Status', accessor: (row) => row.is_active ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-gray-500">Inactive</span> },
          ]}
          data={types}
          loading={fetching}
          error={error}
          getId={(row) => row.id}
          getIsActive={(row) => row.is_active}
          onDeactivate={(id) => setActiveStatus(id, false)}
          onReactivate={(id) => setActiveStatus(id, true)}
          onEdit={handleEdit}
          emptyMessage="No student types found."
        />
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">Student Code *</label>
            <input
              type="text"
              name="student_code"
              value={form.student_code}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Student Type *</label>
            <input
              type="text"
              name="student_type"
              value={form.student_type}
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
              {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Student Type' : 'Add Student Type')}
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
              🎉 Student Type {editingId ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
      </div>
    </div>
  );
}