'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-stone-900 rounded-3xl p-8 border border-stone-800 shadow-2xl shadow-black/20">
        <h1 className="reveal font-display text-3xl text-center text-stone-100 mb-2">Welcome Back</h1>
        <p className="text-center text-stone-500 text-sm mb-8">
          Log in to your Nuvra account
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reveal-stagger space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-1">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 transition-all"
              placeholder="you@example.com" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-1">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 transition-all"
              placeholder="••••••••" required
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-500 text-white py-3 rounded-xl font-medium hover:bg-brand-400 transition-all btn-press disabled:opacity-50 shadow-lg shadow-brand-500/20">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
