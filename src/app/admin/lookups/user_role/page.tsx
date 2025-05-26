'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  created_at: string;
  is_active: boolean;
}

export default function UserRoleLookupAdmin() {
  const [form, setForm] = useState({
    user_id: '',
    role_id: 0,
    is_active: true,
  });
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchUserRoles();
    // eslint-disable-next-line
  }, [showInactive]);

  async function fetchUserRoles() {
    setFetching(true);
    setError('');
    let query = supabase
      .from('user_role')
      .select('*')
      .order('created_at', { ascending: false });
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    setUserRoles(data || []);
    setFetching(false);
  }

  async function setActiveStatus(id: number, is_active: boolean) {
    setError('');
    const { error } = await supabase
      .from('user_role')
      .update({ is_active })
      .eq('id', id);
    if (error) setError(error.message);
    fetchUserRoles();
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
        [name]: name === 'role_id' ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!form.user_id || !form.role_id) {
      setError('User ID and Role ID are required!');
      setLoading(false);
      return;
    }
    if (editingId !== null) {
      // Update
      const { error } = await supabase
        .from('user_role')
        .update({
          user_id: form.user_id,
          role_id: form.role_id,
          is_active: form.is_active,
        })
        .eq('id', editingId);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ user_id: '', role_id: 0, is_active: true });
        setEditingId(null);
        fetchUserRoles();
      }
    } else {
      // Insert
      const { error } = await supabase.from('user_role').insert([
        {
          user_id: form.user_id,
          role_id: form.role_id,
          is_active: form.is_active,
        },
      ]);
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setForm({ user_id: '', role_id: 0, is_active: true });
        fetchUserRoles();
      }
    }
  };

  const handleEdit = (id: number) => {
    const ur = userRoles.find((u) => u.id === id);
    if (ur) {
      setForm({
        user_id: ur.user_id,
        role_id: ur.role_id,
        is_active: ur.is_active,
      });
      setEditingId(id);
      setError('');
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleCancelEdit = () => {
    setForm({ user_id: '', role_id: 0, is_active: true });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-4 sm:p-8">
        <LookupNav />
        <h1 className="text-2xl font-bold mb-6">Manage User Roles Lookup</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <span className="font-semibold">Active User Roles</span>
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
            { label: 'User ID', accessor: 'user_id' },
            { label: 'Role ID', accessor: 'role_id' },
            { label: 'Created At', accessor: 'created_at' },
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
          data={userRoles}
          loading={fetching}
          error={error}
          getId={(row) => row.id.toString()}
          getIsActive={(row) => row.is_active}
          onEdit={(id) => handleEdit(Number(id))}
          emptyMessage="No user roles found."
        />
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">User ID *</label>
            <input
              type="text"
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Role ID *</label>
            <input
              type="number"
              name="role_id"
              value={form.role_id}
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
              {loading ? (editingId !== null ? 'Updating...' : 'Adding...') : (editingId !== null ? 'Update User Role' : 'Add User Role')}
            </button>
            {editingId !== null && (
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
              🎉 User Role {editingId !== null ? 'updated' : 'added'} successfully! You rock! 🎉
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 