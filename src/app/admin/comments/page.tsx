'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Button from '@/components/Button';
import Card, { CardBody } from '@/components/Card';
import { BiCheck, BiTrash, BiX } from 'react-icons/bi';

interface PendingComment {
  id: string;
  postId: string;
  author: { name: string; email: string };
  content: string;
  createdAt: string;
  status: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comments?status=pending');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load comments');
      }
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const moderate = async (commentId: string, status: 'approved' | 'rejected' | 'spam') => {
    setProcessingId(commentId);
    try {
      const res = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, action: 'moderate', status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Moderation failed');
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Moderation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const remove = async (commentId: string) => {
    setProcessingId(commentId);
    try {
      const res = await fetch(`/api/comments?commentId=${commentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="Comment Moderation"
        description="Review and approve pending blog comments."
      >
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-600 dark:text-slate-400">Loading pending comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No pending comments.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {comment.author.name}{' '}
                        <span className="font-normal text-slate-500">({comment.author.email})</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Post: {comment.postId}</p>
                      <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {comment.content}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={processingId === comment.id}
                        onClick={() => moderate(comment.id, 'approved')}
                      >
                        <BiCheck className="mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processingId === comment.id}
                        onClick={() => moderate(comment.id, 'rejected')}
                      >
                        <BiX className="mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processingId === comment.id}
                        onClick={() => remove(comment.id)}
                      >
                        <BiTrash className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
}
