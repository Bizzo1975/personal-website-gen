'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Props = {
  endpoint: '/api/newsletter/confirm' | '/api/newsletter/unsubscribe';
  title: string;
  intro: string;
  buttonLabel: string;
  doneMessage: string;
  askReason?: boolean;
};

/**
 * Confirm / unsubscribe pages act only when the reader clicks the button, so mail
 * scanners that open links automatically cannot confirm or unsubscribe anyone.
 */
function TokenActionInner({ endpoint, title, intro, buttonLabel, doneMessage, askReason }: Props) {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');

  const submit = async () => {
    setState('working');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: askReason && reason.trim() ? reason.trim() : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h1>
      {!token ? (
        <p className="text-red-600">This link is missing its token. Please use the link from your email.</p>
      ) : state === 'done' ? (
        <p className="text-green-700 dark:text-green-400">{doneMessage}</p>
      ) : (
        <>
          <p className="text-slate-700 dark:text-slate-300 mb-6">{intro}</p>
          {askReason && (
            <label className="block mb-4 text-sm text-slate-700 dark:text-slate-300">
              Reason (optional)
              <textarea
                className="mt-1 w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
                rows={3}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={state === 'working'}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {state === 'working' ? 'Please wait…' : buttonLabel}
          </button>
          {state === 'error' && <p className="mt-4 text-red-600">{message}</p>}
        </>
      )}
    </div>
  );
}

export default function TokenAction(props: Props) {
  return (
    <Suspense fallback={null}>
      <TokenActionInner {...props} />
    </Suspense>
  );
}
