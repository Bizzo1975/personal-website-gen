import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

interface DbCommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  author_avatar: string | null;
  content: string;
  status: CommentStatus;
  likes: number;
  dislikes: number;
  is_edited: boolean;
  mentions: string[];
  created_at: Date;
  updated_at: Date;
}

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
  status: CommentStatus;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike' | null;
  isEdited: boolean;
  mentions: string[];
}

const SPAM_KEYWORDS = ['spam', 'viagra', 'casino', 'lottery'];

function mapRow(row: DbCommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id || undefined,
    author: {
      name: row.author_name,
      email: row.author_email || '',
      avatar: row.author_avatar || undefined,
    },
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    likes: row.likes,
    dislikes: row.dislikes,
    userReaction: null,
    isEdited: row.is_edited,
    mentions: row.mentions || [],
    replies: [],
  };
}

function nestComments(flat: Comment[]): Comment[] {
  const byId = new Map(flat.map((c) => [c.id, c]));
  const roots: Comment[] = [];

  for (const comment of flat) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies!.push(comment);
    } else if (!comment.parentId) {
      roots.push(comment);
    }
  }

  return roots;
}

function sortComments(comments: Comment[], sortBy: string): Comment[] {
  const sorted = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return b.likes - b.dislikes - (a.likes - a.dislikes);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return sorted.map((c) => ({
    ...c,
    replies: c.replies?.length ? sortComments(c.replies, sortBy) : [],
  }));
}

function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9\s]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].trim());
  }
  return mentions;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const status = (searchParams.get('status') || 'approved') as CommentStatus | 'all';

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    if (!postId) {
      if (!isAdmin || status === 'approved') {
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
      }
    } else if (status !== 'approved' && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const params: string[] = [];
    const where: string[] = [];

    if (postId) {
      params.push(postId);
      where.push(`post_id = $${params.length}`);
    }

    if (status === 'approved') {
      where.push("status = 'approved'");
    } else if (status === 'all') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } else {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await query(
      `SELECT id, post_id, parent_id, author_name, author_email, author_avatar,
              content, status, likes, dislikes, is_edited, mentions,
              created_at, updated_at
       FROM blog_comments
       ${whereClause}
       ORDER BY created_at ASC`,
      params
    );

    const flat = result.rows.map(mapRow);
    const comments = postId ? sortComments(nestComments(flat), sortBy) : flat;

    return NextResponse.json({
      comments,
      total: result.rowCount ?? 0,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { postId, content, parentId, guestInfo } = body;

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'Post ID and content are required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 });
    }

    let authorName: string;
    let authorEmail: string;
    let authorAvatar: string | null = null;

    if (session?.user) {
      authorName = session.user.name || 'Anonymous';
      authorEmail = session.user.email || '';
      authorAvatar = session.user.image || null;
    } else {
      if (!guestInfo?.name?.trim() || !guestInfo?.email?.trim()) {
        return NextResponse.json(
          { error: 'Name and email are required for guest comments' },
          { status: 400 }
        );
      }
      authorName = guestInfo.name.trim();
      authorEmail = guestInfo.email.trim();
      authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;
    }

    const isSpam = SPAM_KEYWORDS.some((keyword) => content.toLowerCase().includes(keyword));
    const status: CommentStatus = isSpam ? 'spam' : 'pending';
    const mentions = extractMentions(content);

    const result = await query(
      `INSERT INTO blog_comments
         (post_id, parent_id, author_name, author_email, author_avatar, content, status, mentions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, post_id, parent_id, author_name, author_email, author_avatar,
                 content, status, likes, dislikes, is_edited, mentions,
                 created_at, updated_at`,
      [
        postId,
        parentId || null,
        authorName,
        authorEmail,
        authorAvatar,
        content.trim(),
        status,
        mentions,
      ]
    );

    const comment = mapRow(result.rows[0]);

    return NextResponse.json(
      {
        comment,
        message: 'Comment submitted successfully. It will appear after moderation.',
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { commentId, content, status, action } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (action === 'moderate' && status) {
      const validStatuses: CommentStatus[] = ['pending', 'approved', 'rejected', 'spam'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const result = await query(
        `UPDATE blog_comments
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, post_id, parent_id, author_name, author_email, author_avatar,
                   content, status, likes, dislikes, is_edited, mentions,
                   created_at, updated_at`,
        [status, commentId]
      );

      if (!result.rowCount) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      return NextResponse.json({
        comment: mapRow(result.rows[0]),
        message: 'Comment updated successfully',
        success: true,
      });
    }

    if (content?.trim()) {
      const result = await query(
        `UPDATE blog_comments
         SET content = $1, is_edited = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, post_id, parent_id, author_name, author_email, author_avatar,
                   content, status, likes, dislikes, is_edited, mentions,
                   created_at, updated_at`,
        [content.trim(), commentId]
      );

      if (!result.rowCount) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      return NextResponse.json({
        comment: mapRow(result.rows[0]),
        message: 'Comment updated successfully',
        success: true,
      });
    }

    return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await query('DELETE FROM blog_comments WHERE id = $1', [commentId]);

    if (!result.rowCount) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Comment deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
