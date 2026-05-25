import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getUserFromToken, setToken } from '../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (getUserFromToken()) {
      router.replace('/');
    }
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await response.json();

    if (response.ok) {
      setToken(result.token);
      setMessage('Login successful! Redirecting to dashboard...');
      setMessageType('success');
      setTimeout(() => router.push('/'), 1000);
    } else {
      setMessage(result.message || 'Login failed.');
      setMessageType('error');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl border border-slate-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">Log in to your account</h2>
          <p className="mt-2 text-center text-sm text-slate-500">Use your email and password to access the monthly dashboard.</p>
        </div>

        {message && (
          <div className={`rounded-2xl border px-4 py-3 mt-6 text-sm ${messageType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-3xl shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="appearance-none rounded-2xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="appearance-none rounded-2xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-500 mt-6">
          Don’t have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

LoginPage.noLayout = true;
