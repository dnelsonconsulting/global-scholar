'use client';
import GlobalNavTrim from '@/components/GlobalNavTrim';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/student/dashboard');
    }
  }

  function handleApplyNow() {
    router.push('/auth/signup');
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetMsg('');
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) {
      setResetMsg('');
      setError(error.message);
    } else {
      setResetMsg('Password reset email sent! Check your inbox.');
    }
  }

  return ( 
    <div>   
        <GlobalNavTrim />
      <div className="relative min-h-screen bg-gradient-to-br from-black-40 to-blue-50 font-sans flex items-center justify-center overflow-hidden">
       
        {/* Hero image as background */}
      <img
        src="/hero.png"
        alt="Graduation"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70 blur-[2px] pointer-events-none z-0 scale-x-[-1]"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>
      {/* Main content (two columns) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 py-16 px-4">
        {/* Left Column: Headline & Description */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left pt-[50px]">
          <br/>
            <br/>
          <br/><br/>
            <img src="/logo.png" alt="Global Scholar Logo" className="h-24 w-24 md:h-32 md:w-32" />
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'Open Sans, Inter, sans-serif' }}>Miscio</h1>
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'Open Sans, Inter, sans-serif' }}>
            Global Education<br />Application System
          </h2>
          <p className="text-xl text-gray-200 max-w-xl mb-8">
            Your gateway to seamless educational application and enrollment management.<br /><br/>
            Track your progress, manage documents, and stay updated throughout your academic journey.
          </p>
        </div>
        {/* Right Column: Login/Apply Card */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md bg-white bg-opacity-45 rounded-2xl shadow-xl p-10 border border-gray-30">
            <h2 className="text-2xl font-bold mb-2 text-primary-navy text-center">Welcome to Global Scholar</h2>
            <p className="text-black mb-8 text-center">
              Current students: log in below.<br />
              New students: start your application!
            </p>
            {!showForgot ? (
              <form onSubmit={handleLogin} className="space-y-4 mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-navy focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-navy focus:outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary-navy text-white py-2 rounded-lg font-semibold hover:bg-primary-blue transition"
                >
                  Log In
                </button>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-primary-navy hover:underline text-sm mt-2"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                {error && <div className="text-red-500 text-center">{error}</div>}
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 mb-6">
                <input
                  type="email"
                  placeholder="Enter your email to reset password"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-navy focus:outline-none"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary-navy text-white py-2 rounded-lg font-semibold hover:bg-primary-blue transition"
                >
                  Send Reset Email
                </button>
                <button
                  type="button"
                  className="text-gray-600 hover:underline text-sm mt-2"
                  onClick={() => { setShowForgot(false); setResetMsg(''); setError(''); }}
                >
                  Back to Login
                </button>
                {resetMsg && <div className="text-green-600 text-center">{resetMsg}</div>}
                {error && <div className="text-red-500 text-center">{error}</div>}
              </form>
            )}
            <div className="flex flex-col items-center">
              <span className="text-black mb-2">New here?</span>
              <button
                onClick={handleApplyNow}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Apply Now
              </button>
            </div>
            {isAdmin && (
              <div className="bg-yellow-100 rounded-xl shadow p-8 mb-6 hover:bg-yellow-200 transition cursor-pointer">
                <a href="/student/dashboard" className="block h-full w-full">
                  <h2 className="text-2xl font-bold mb-2 text-yellow-800">Admin</h2>
                  <p className="text-yellow-700">Go to the admin dashboard</p>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
} 