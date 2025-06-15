import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

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

// GET - Fetch comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const status = searchParams.get('status') || 'approved';

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // In a real app, fetch from database
    // For now, return mock data
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

    // Filter by status
    const filteredComments = status === 'all' 
      ? mockComments 
      : mockComments.filter(comment => comment.status === status);

    // Sort comments
    const sortedComments = filteredComments.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'popular':
          return (b.likes - b.dislikes) - (a.likes - a.dislikes);
        default: // newest
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return NextResponse.json({
      comments: sortedComments,
      total: sortedComments.length,
      success: true
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { postId, content, parentId, guestInfo } = body;

    if (!postId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Check for spam (basic)
    const spamKeywords = ['spam', 'viagra', 'casino', 'lottery'];
    const isSpam = spamKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    // Extract mentions
    const mentionRegex = /@([a-zA-Z0-9\s]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1].trim());
    }

    // Create comment object
    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      parentId: parentId || undefined,
      author: session?.user ? {
        name: session.user.name || 'Anonymous',
        email: session.user.email || '',
        avatar: session.user.image || undefined,
        isVerified: true
      } : {
        name: guestInfo?.name || 'Anonymous',
        email: guestInfo?.email || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestInfo?.name}`
      },
      content: content.trim(),
      createdAt: new Date(),
      status: isSpam ? 'spam' : 'pending', // Require moderation
      likes: 0,
      dislikes: 0,
      userReaction: null,
      isEdited: false,
      mentions,
      replies: []
    };

    // In a real app, save to database
    console.log('Creating comment:', newComment);

    // Send notifications for mentions
    if (mentions.length > 0) {
      // In a real app, send email notifications to mentioned users
      console.log('Sending mention notifications to:', mentions);
    }

    return NextResponse.json({
      comment: newComment,
      message: 'Comment submitted successfully. It will appear after moderation.',
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PUT - Update comment (edit or moderate)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { commentId, content, status, action } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    if (action === 'moderate' && (!session || session.user?.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // In a real app, fetch and update comment in database
    const updatedComment = {
      id: commentId,
      content: content || undefined,
      status: status || undefined,
      updatedAt: new Date(),
      isEdited: !!content
    };

    console.log('Updating comment:', updatedComment);

    return NextResponse.json({
      comment: updatedComment,
      message: 'Comment updated successfully',
      success: true
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Check permissions - only admin or comment author can delete
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // In a real app, delete from database
    console.log('Deleting comment:', commentId);

    return NextResponse.json({
      message: 'Comment deleted successfully',
      success: true
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
} 
