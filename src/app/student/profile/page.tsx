'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Layout from '@/components/StudentPortal/Layout';

interface Country {
  id: string;
  country_name: string;
}

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    additional_name: '',
    nationality_country_id: '',
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialForm, setInitialForm] = useState(form);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setEmail(user?.email || '');
      if (!user) {
        setLoading(false);
        return;
      }
      // Fetch student info
      const { data: studentData } = await supabase
        .from('student')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setStudent(studentData);
      setForm({
        first_name: studentData?.first_name || '',
        middle_name: studentData?.middle_name || '',
        last_name: studentData?.last_name || '',
        additional_name: studentData?.additional_name || '',
        nationality_country_id: studentData?.nationality_country_id || '',
      });
      setInitialForm({
        first_name: studentData?.first_name || '',
        middle_name: studentData?.middle_name || '',
        last_name: studentData?.last_name || '',
        additional_name: studentData?.additional_name || '',
        nationality_country_id: studentData?.nationality_country_id || '',
      });
      // Fetch countries
      const { data: countryList } = await supabase
        .from('country')
        .select('id, country_name')
        .eq('is_active', true)
        .order('country_name', { ascending: true });
      setCountries(countryList || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e: any) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    setIsDirty(
      newForm.first_name !== initialForm.first_name ||
      newForm.middle_name !== initialForm.middle_name ||
      newForm.last_name !== initialForm.last_name ||
      newForm.additional_name !== initialForm.additional_name ||
      newForm.nationality_country_id !== initialForm.nationality_country_id
    );
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    const { error } = await supabase
      .from('student')
      .update({
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        additional_name: form.additional_name,
        nationality_country_id: form.nationality_country_id,
      })
      .eq('user_id', user.id);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Profile updated successfully!');
    }
    setSaving(false);
  };

  const handleEmailChange = async (e: any) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailMsg(error.message);
    } else {
      setEmailMsg('Email update requested. Please check your new email to confirm.');
      setEmail(newEmail);
      setNewEmail('');
    }
    setEmailLoading(false);
  };

  const handlePasswordChange = async (e: any) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg('Password updated successfully!');
      setNewPassword('');
    }
    setPasswordLoading(false);
  };

  const saveDisabled = !isDirty || !form.first_name.trim() || !form.last_name.trim() || saving;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
  }

  console.log('student.id:', student.id, typeof student.id);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-8 text-center">Profile</h1>
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" name="first_name" value={form.first_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input type="text" name="middle_name" value={form.middle_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" name="last_name" value={form.last_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Name</label>
              <input type="text" name="additional_name" value={form.additional_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Country of Residence</label>
              <select name="nationality_country_id" value={form.nationality_country_id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.country_name}</option>
                ))}
              </select>
            </div>
          </div>
          {successMsg && <div className="text-green-600 text-sm font-medium">{successMsg}</div>}
          {errorMsg && <div className="text-red-600 text-sm font-medium">{errorMsg}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saveDisabled}
              title={
                !form.first_name.trim() || !form.last_name.trim()
                  ? 'First and last name are required'
                  : !isDirty
                  ? 'No changes to save'
                  : ''
              }
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Email Change Section */}
        <div className="bg-white rounded-xl shadow p-6 mt-8 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Change Email</h2>
          <div className="mb-2 text-gray-700">Current Email: <span className="font-mono">{email}</span></div>
          <form onSubmit={handleEmailChange} className="flex flex-col sm:flex-row gap-4 items-end">
            <input type="email" placeholder="New email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="border border-gray-300 rounded-md p-2 w-full sm:w-auto" required />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition" disabled={emailLoading}>
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
          {emailMsg && <div className="mt-2 text-sm font-medium text-blue-700">{emailMsg}</div>}
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-xl shadow p-6 mt-8 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="flex flex-col sm:flex-row gap-4 items-end">
            <input type={showPassword ? 'text' : 'password'} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border border-gray-300 rounded-md p-2 w-full sm:w-auto" required minLength={6} />
            <button type="button" className="text-xs text-blue-600 underline" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          {passwordMsg && <div className="mt-2 text-sm font-medium text-blue-700">{passwordMsg}</div>}
        </div>

        <div>
          <strong>student.id:</strong> {student.id} ({typeof student.id})
        </div>
      </div>
    </Layout>
  );
} 