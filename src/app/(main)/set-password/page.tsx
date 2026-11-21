'use client';

/** W46: set a password from the one-time link in the access-approval e-mail. */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const field = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500';

export default function SetPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setEmail(p.get('email') || '');
    setToken(p.get('token') || '');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 12) return setError('Use at least 12 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || `Your password could not be saved (${res.status}).`);
      setDone(true);
    } catch {
      setError('Your password could not be saved (network error).');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Set your password</h1>
      {done ? (
        <div role="status" className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Your password is set.</p>
          <Link href="/login" className="text-blue-600 dark:text-blue-400 underline">Sign in</Link>
        </div>
      ) : !token ? (
        <p role="alert" className="text-red-600 dark:text-red-400">This page needs the link from your approval e-mail.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">For {email || 'your account'}</p>
          <label className="block">
            <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New password (at least 12 characters)</span>
            <input type="password" autoComplete="new-password" className={field} value={password} onChange={e => setPassword(e.target.value)} required minLength={12} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Repeat it</span>
            <input type="password" autoComplete="new-password" className={field} value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </label>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="w-full px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60">
            {busy ? 'Saving…' : 'Set password'}
          </button>
        </form>
      )}
    </div>
  );
}
