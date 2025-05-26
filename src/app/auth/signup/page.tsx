"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [additionalName, setAdditionalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("Signing up...");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      // Insert student record with names
      const user = data?.user;
      if (user) {
        const { error: studentError } = await supabase.from('student').insert({
          email,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          additional_name: additionalName,
          user_id: user.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (studentError) {
          setMessage(`Signup succeeded, but failed to create student record: ${studentError.message}`);
          return;
        }
      }
      setMessage("Success! Redirecting to dashboard...");
      setTimeout(() => {
        window.location.replace("/student/dashboard");
      }, 1000);
    } catch (err: any) {
      setMessage(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold">Sign up</h2>
        </div>
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="sr-only">First Name</label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="First Name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="middleName" className="sr-only">Middle Name</label>
            <input
              id="middleName"
              type="text"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Middle Name (optional)"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="sr-only">Last Name</label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Last Name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="additionalName" className="sr-only">Additional Name</label>
            <input
              id="additionalName"
              type="text"
              value={additionalName}
              onChange={e => setAdditionalName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Additional Name (optional)"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Email address"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Password"
              disabled={loading}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded"
            >
              {loading ? "Processing..." : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 