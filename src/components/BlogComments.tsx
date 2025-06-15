'use client';

import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  postId: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
    isVerified?: boolean;
  };
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parentId?: string;
  replies?: Comment[];
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike' | null;
  isEdited: boolean;
  mentions: string[];
}

interface BlogCommentsProps {
  postId: string;
  postTitle: string;
  allowAnonymous?: boolean;
  moderationEnabled?: boolean;
  maxDepth?: number;
  className?: string;
}

const BlogComments: React.FC<BlogCommentsProps> = ({
  postId,
  postTitle,
  allowAnonymous = true,
  moderationEnabled = true,
  maxDepth = 3,
  className = ''
}) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', website: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockComments: Comment[] = [
        {
          id: '1',
          postId,
          author: {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            isVerified: true
          },
          content: 'Great article! This really helped me understand React Hooks better. The examples are clear and practical.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'approved',
          likes: 12,
          dislikes: 1,
          userReaction: null,
          isEdited: false,
          mentions: [],
          replies: [
            {
              id: '2',
              postId,
              parentId: '1',
              author: {
                name: 'Bob Smith',
                email: 'bob@example.com',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
              },
              content: 'I agree! @Alice Johnson The useState examples were particularly helpful.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              status: 'approved',
              likes: 5,
              dislikes: 0,
              userReaction: null,
              isEdited: false,
              mentions: ['Alice Johnson'],
              replies: []
            }
          ]
        },
        {
          id: '3',
          postId,
          author: {
            name: 'Charlie Wilson',
            email: 'charlie@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
          },
          content: 'Could you write a follow-up article about custom hooks? That would be amazing!',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'approved',
          likes: 8,
          dislikes: 0,
          userReaction: 'like',
          isEdited: false,
          mentions: [],
          replies: []
        }
      ];
      
      setComments(mockComments);
      setIsLoading(false);
    };

    fetchComments();
  }, [postId, sortBy]);

  // Submit new comment
  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCommentData: Comment = {
        id: Date.now().toString(),
        postId,
        parentId,
        author: session?.user ? {
          name: session.user.name || 'Anonymous',
          email: session.user.email || '',
          avatar: session.user.image || undefined,
          isVerified: true
        } : {
          name: guestInfo.name || 'Anonymous',
          email: guestInfo.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestInfo.name}`
        },
        content: content.trim(),
        createdAt: new Date(),
        status: moderationEnabled ? 'pending' : 'approved',
        likes: 0,
        dislikes: 0,
        userReaction: null,
        isEdited: false,
        mentions: extractMentions(content),
        replies: []
      };

      if (parentId) {
        // Add reply to parent comment
        setComments(prev => addReplyToComment(prev, parentId, newCommentData));
      } else {
        // Add top-level comment
        setComments(prev => [newCommentData, ...prev]);
      }

      // Reset form
      setNewComment('');
      setReplyingTo(null);
      setGuestInfo({ name: '', email: '', website: '' });
      setShowGuestForm(false);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to add reply to nested structure
  const addReplyToComment = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      } else if (comment.replies) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, reply)
        };
      }
      return comment;
    });
  };

  // Extract mentions from comment content
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9\s]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1].trim());
    }
    
    return mentions;
  };

  // Handle comment reactions
  const handleReaction = async (commentId: string, reaction: 'like' | 'dislike') => {
    // In a real app, this would be an API call
    setComments(prev => updateCommentReaction(prev, commentId, reaction));
  };

  const updateCommentReaction = (comments: Comment[], commentId: string, reaction: 'like' | 'dislike'): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        const currentReaction = comment.userReaction;
        let newLikes = comment.likes;
        let newDislikes = comment.dislikes;
        let newReaction: 'like' | 'dislike' | null = reaction;

        // Handle reaction logic
        if (currentReaction === reaction) {
          // Remove reaction
          newReaction = null;
          if (reaction === 'like') newLikes--;
          else newDislikes--;
        } else {
          // Add or change reaction
          if (currentReaction === 'like') newLikes--;
          if (currentReaction === 'dislike') newDislikes--;
          
          if (reaction === 'like') newLikes++;
          else newDislikes++;
        }

        return {
          ...comment,
          likes: newLikes,
          dislikes: newDislikes,
          userReaction: newReaction
        };
      } else if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentReaction(comment.replies, commentId, reaction)
        };
      }
      return comment;
    });
  };

  // Sort comments
  const sortComments = (comments: Comment[]): Comment[] => {
    const sorted = [...comments].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'popular':
          return (b.likes - b.dislikes) - (a.likes - a.dislikes);
        default: // newest
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    // Recursively sort replies
    return sorted.map(comment => ({
      ...comment,
      replies: comment.replies ? sortComments(comment.replies) : []
    }));
  };

  // Render individual comment
  const renderComment = (comment: Comment, depth: number = 0) => {
    const canReply = depth < maxDepth;
    const isReplying = replyingTo === comment.id;
    const isEditing = editingComment === comment.id;

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-200 dark:border-slate-600 pl-4' : ''}`}
      >
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src={comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.name}`}
                alt={`${comment.author.name} avatar`}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {comment.author.name}
                  </span>
                  {comment.author.isVerified && (
                    <span className="text-blue-500" title="Verified user">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  {comment.status === 'pending' && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                      Pending Approval
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {comment.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  {comment.isEdited && (
                    <span className="ml-2 text-xs">(edited)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comment Actions Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingComment(comment.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                title="Edit comment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Comment Content */}
          <div className="text-slate-900 dark:text-slate-100 mb-3">
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReaction(comment.id, 'like')}
              className={`flex items-center gap-1 text-sm ${
                comment.userReaction === 'like'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {comment.likes}
            </button>

            <button
              onClick={() => handleReaction(comment.id, 'dislike')}
              className={`flex items-center gap-1 text-sm ${
                comment.userReaction === 'dislike'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'rotate(180deg)' }}>
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {comment.dislikes}
            </button>

            {canReply && (
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <CommentForm
                onSubmit={(content) => handleSubmitComment(content, comment.id)}
                onCancel={() => setReplyingTo(null)}
                placeholder={`Reply to ${comment.author.name}...`}
                isSubmitting={isSubmitting}
                showGuestForm={showGuestForm && !session}
                guestInfo={guestInfo}
                onGuestInfoChange={setGuestInfo}
                allowAnonymous={allowAnonymous}
              />
            </div>
          )}
        </div>

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                </div>
              </div>
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Comments ({totalComments})
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Join the discussion about "{postTitle}"
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* New Comment Form */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <CommentForm
          onSubmit={(content) => handleSubmitComment(content)}
          placeholder="Share your thoughts..."
          isSubmitting={isSubmitting}
          showGuestForm={showGuestForm && !session}
          guestInfo={guestInfo}
          onGuestInfoChange={setGuestInfo}
          allowAnonymous={allowAnonymous}
          onShowGuestForm={setShowGuestForm}
        />
      </div>

      {/* Comments List */}
      <div className="p-6">
        {comments.length > 0 ? (
          <div className="space-y-6">
            {sortComments(comments).map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No comments yet
            </h4>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Be the first to share your thoughts about this post!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Comment Form Component
interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isSubmitting: boolean;
  showGuestForm: boolean;
  guestInfo: { name: string; email: string; website: string };
  onGuestInfoChange: (info: { name: string; email: string; website: string }) => void;
  allowAnonymous: boolean;
  onShowGuestForm?: (show: boolean) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  isSubmitting,
  showGuestForm,
  guestInfo,
  onGuestInfoChange,
  allowAnonymous,
  onShowGuestForm
}) => {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    if (!session && (!guestInfo.name || !guestInfo.email)) {
      onShowGuestForm?.(true);
      return;
    }
    
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Guest Information Form */}
      {showGuestForm && !session && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <input
            type="text"
            placeholder="Your name *"
            value={guestInfo.name}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, name: e.target.value })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            required
          />
          <input
            type="email"
            placeholder="Your email *"
            value={guestInfo.email}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, email: e.target.value })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
            required
          />
          <input
            type="url"
            placeholder="Website (optional)"
            value={guestInfo.website}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, website: e.target.value })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          />
        </div>
      )}

      {/* Comment Content */}
      <div>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 text-sm rounded-md ${
              !showPreview
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 text-sm rounded-md ${
              showPreview
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Preview
          </button>
        </div>

        {showPreview ? (
          <div className="min-h-[100px] p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
            {content || <span className="text-slate-400">Nothing to preview</span>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-y"
            required
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {session ? (
            <span>Commenting as {session.user?.name}</span>
          ) : allowAnonymous ? (
            <span>
              <button
                type="button"
                onClick={() => window.location.href = '/admin/login'}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign in
              </button>
              {' '}or comment as guest
            </span>
          ) : (
            <span>
              Please{' '}
              <button
                type="button"
                onClick={() => window.location.href = '/admin/login'}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                sign in
              </button>
              {' '}to comment
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <AccessibleButton
              type="button"
              onClick={onCancel}
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
            >
              Cancel
            </AccessibleButton>
          )}
          <AccessibleButton
            type="submit"
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={!content.trim() || (!session && allowAnonymous && (!guestInfo.name || !guestInfo.email))}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </AccessibleButton>
        </div>
      </div>
    </form>
  );
};

export default BlogComments; 