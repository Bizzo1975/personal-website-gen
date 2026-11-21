'use client';

/**
 * W46: reader sign-in for gated (professional/personal) content. The only sign-in page was
 * /admin/login, which sends everyone to Kecktech SSO and then to the admin dashboard, so
 * a person granted access had no way to sign in and read.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const field = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500';

export default function ReaderLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState('/');

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('callbackUrl');
    // Same-site paths only.
    if (c && c.startsWith('/') && !c.startsWith('//') && !c.startsWith('/admin')) setNext(c);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await signIn('credentials', { redirect: false, email, password });
      if (!r || r.error) {
        setError('Sign-in failed. Check your e-mail and password.');
        return;
      }
      window.location.assign(next);
    } catch {
      setError('Sign-in failed (network error).');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Sign in</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">For readers who were given access to professional or personal content.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail</span>
          <input type="email" autoComplete="email" className={field} value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</span>
          <input type="password" autoComplete="current-password" className={field} value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className="w-full px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        No access yet? <Link href="/request-status" className="underline">Check a request</Link>.
      </p>
    </div>
  );
}
