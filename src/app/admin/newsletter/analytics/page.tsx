'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  EnvelopeIcon,
  UserPlusIcon,
  UserMinusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/app/admin/components/AdminLayout';

// Mirrors /api/newsletter/admin/stats (database figures only).
interface Stats {
  period: string;
  subscribers: { total: number; confirmed: number; pending: number; inactive: number };
  campaigns: { sent: number; failed: number; scheduled: number; draft: number };
  delivery: { emailsSent: number; emailsFailed: number; failureRate: number | null };
  growth: { newSubscribers: number; unsubscribes: number; netGrowth: number };
  bySource: { source: string; count: number }[];
}

const PERIODS = [
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'all_time', label: 'All time' },
];

const fmt = (v: number) => v.toLocaleString();
// A share of zero is undefined, not 0% or NaN% (W6).
const share = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—');

const Tile = ({ label, value, note, icon }: { label: string; value: string; note?: string; icon: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
    </div>
    {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{note}</p>}
  </div>
);

const Row = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-white">
      {value}{sub && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{sub}</span>}
    </span>
  </div>
);

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('last_30_days');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/newsletter/admin/stats?period=${encodeURIComponent(p)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStats(data);
    } catch (e) {
      setStats(null);
      setError(`Could not load newsletter statistics: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const periodLabel = PERIODS.find((p) => p.value === period)?.label.toLowerCase() || '';

  return (
    <AdminLayout title="Newsletter Analytics">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Newsletter Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Figures from the newsletter database.</p>
          </div>
          <select
            aria-label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </div>
        )}

        {loading && !stats && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Tile
                label="Confirmed subscribers"
                value={fmt(stats.subscribers.confirmed)}
                note="The only people who receive newsletters"
                icon={<UserPlusIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
              />
              <Tile
                label={`Emails sent (${periodLabel})`}
                value={fmt(stats.delivery.emailsSent)}
                icon={<EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              />
              <Tile
                label={`Failed sends (${periodLabel})`}
                value={fmt(stats.delivery.emailsFailed)}
                note={stats.delivery.failureRate === null ? 'No sends attempted' : `${stats.delivery.failureRate.toFixed(1)}% of attempts`}
                icon={<ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
              />
              <Tile
                label={`Unsubscribes (${periodLabel})`}
                value={fmt(stats.growth.unsubscribes)}
                icon={<UserMinusIcon className="h-6 w-6 text-red-600 dark:text-red-400" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscribers</h3>
                <div className="space-y-3">
                  <Row label="Confirmed" value={fmt(stats.subscribers.confirmed)} sub={share(stats.subscribers.confirmed, stats.subscribers.total)} />
                  <Row label="Awaiting confirmation" value={fmt(stats.subscribers.pending)} sub={share(stats.subscribers.pending, stats.subscribers.total)} />
                  <Row label="Unsubscribed or inactive" value={fmt(stats.subscribers.inactive)} sub={share(stats.subscribers.inactive, stats.subscribers.total)} />
                  <Row label="Total" value={fmt(stats.subscribers.total)} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth ({periodLabel})</h3>
                <div className="space-y-3">
                  <Row label="New signups" value={fmt(stats.growth.newSubscribers)} />
                  <Row label="Unsubscribes" value={fmt(stats.growth.unsubscribes)} />
                  <Row label="Net growth" value={fmt(stats.growth.netGrowth)} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaigns (all time)</h3>
                <div className="space-y-3">
                  <Row label="Sent" value={fmt(stats.campaigns.sent)} />
                  <Row label="Failed" value={fmt(stats.campaigns.failed)} />
                  <Row label="Scheduled" value={fmt(stats.campaigns.scheduled)} />
                  <Row label="Drafts" value={fmt(stats.campaigns.draft)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirmed subscribers by signup source</h3>
                {stats.bySource.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No confirmed subscribers yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.bySource.map((s) => (
                      <Row key={s.source} label={s.source} value={fmt(s.count)} sub={share(s.count, stats.subscribers.confirmed)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Not tracked</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Open rate, click rate and bounces are not measured: emails carry no tracking pixel or
                  tracked links, and bounce notifications are not collected. They are left blank rather than estimated.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;
