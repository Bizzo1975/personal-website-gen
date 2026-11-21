'use client';

/**
 * W50: blog comments backed by /api/comments (blog_comments table).
 *
 * The old component showed three invented comments ("Alice Johnson", "Bob Smith",
 * "Charlie Wilson", with like counts) under every post, and a new comment, reaction or
 * edit only changed the page's memory — nothing was saved. Now: approved comments are
 * read from the API; a new comment or reply is saved as pending and appears after an
 * admin approves it in Admin > Comments. Reactions are not offered (nothing stores them).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  parentId?: string;
  author: { name: string; avatar?: string };
  content: string;
  createdAt: string;
  isEdited: boolean;
  replies?: Comment[];
}

interface BlogCommentsProps {
  postId: string;
  postTitle: string;
  allowAnonymous?: boolean;
  moderationEnabled?: boolean;
  maxDepth?: number;
  className?: string;
}

const field = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white';

function CommentForm({ postId, parentId, allowAnonymous, onDone }: { postId: string; parentId?: string; allowAnonymous: boolean; onDone: (msg: string) => void }) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = Boolean(session?.user);

  if (!signedIn && !allowAnonymous) return <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to comment.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, parentId, content, ...(signedIn ? {} : { guestInfo: { name, email } }) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Your comment could not be saved (${res.status}).`);
        return;
      }
      setContent('');
      onDone(data.comment?.status === 'spam'
        ? 'Your comment was held as possible spam and will be reviewed.'
        : 'Thanks — your comment was received and will appear after it is approved.');
    } catch {
      setError('Your comment could not be saved (network error).');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {!signedIn && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="block mb-1 text-gray-700 dark:text-gray-300">Name</span>
            <input className={field} value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
          </label>
          <label className="block text-sm">
            <span className="block mb-1 text-gray-700 dark:text-gray-300">E-mail (not shown)</span>
            <input type="email" className={field} value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
          </label>
        </div>
      )}
      <label className="block text-sm">
        <span className="block mb-1 text-gray-700 dark:text-gray-300">{parentId ? 'Your reply' : 'Your comment'}</span>
        <textarea className={field} rows={parentId ? 3 : 4} value={content} onChange={e => setContent(e.target.value)} required maxLength={2000} />
      </label>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={busy || !content.trim()} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-60">
        {busy ? 'Sending…' : parentId ? 'Send reply' : 'Post comment'}
      </button>
      {signedIn && <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">Commenting as {session?.user?.name || session?.user?.email}</span>}
    </form>
  );
}

const BlogComments: React.FC<BlogCommentsProps> = ({ postId, postTitle, allowAnonymous = true, maxDepth = 3, className = '' }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}&sortBy=${sortBy}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || 'Comments could not be loaded.');
        return;
      }
      setComments(data.comments || []);
      setCount(data.total ?? 0);
    } catch {
      setLoadError('Comments could not be loaded (network error).');
    } finally {
      setLoading(false);
    }
  }, [postId, sortBy]);

  useEffect(() => { if (postId) load(); }, [postId, load]);

  const render = (c: Comment, depth: number): React.ReactNode => (
    <li key={c.id} className="py-4">
      <div className="flex items-start gap-3">
        {c.author.avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.author.avatar} alt="" className="w-9 h-9 rounded-full" />
          : <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden />}
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">{c.author.name}</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
            {c.isEdited && <span className="ml-2 text-xs text-gray-400">(edited)</span>}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">{c.content}</p>
          {depth < maxDepth && (
            <button type="button" className="mt-2 text-sm text-blue-600 dark:text-blue-400" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
              {replyTo === c.id ? 'Cancel reply' : 'Reply'}
            </button>
          )}
          {replyTo === c.id && (
            <div className="mt-3">
              <CommentForm postId={postId} parentId={c.id} allowAnonymous={allowAnonymous} onDone={msg => { setReplyTo(null); setNotice(msg); }} />
            </div>
          )}
          {c.replies && c.replies.length > 0 && (
            <ul className="mt-2 pl-4 border-l border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {c.replies.map(r => render(r, depth + 1))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <section className={className} aria-labelledby="comments-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="comments-heading" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Comments{!loading && !loadError ? ` (${count})` : ''}
        </h2>
        <label className="text-sm text-gray-600 dark:text-gray-400">
          <span className="sr-only">Sort comments</span>
          <select className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 px-2 py-1" value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Join the discussion about “{postTitle}”. Comments appear after approval.</p>
        <CommentForm postId={postId} allowAnonymous={allowAnonymous} onDone={setNotice} />
        {notice && <p role="status" className="mt-3 text-sm text-green-700 dark:text-green-300">{notice}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading comments…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">{comments.map(c => render(c, 1))}</ul>
      )}
    </section>
  );
};

export default BlogComments;
