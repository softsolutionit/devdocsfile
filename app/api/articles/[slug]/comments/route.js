import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { getClientIp } from 'request-ip';
import { RateLimiter } from '@/lib/rate-limiter';
import { auth } from '@/auth';

// Initialize rate limiter: 10 comments per minute per IP
const commentLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

// Helper function to check for spam
const isSpam = (content) => {
  // Basic spam detection - can be enhanced with more sophisticated checks
  const spamKeywords = ['buy now', 'discount', 'http://', 'https://', 'www.'];
  return spamKeywords.some(keyword => content.toLowerCase().includes(keyword));
};

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const showAll = searchParams.get('showAll') === 'true';

    const comments = await prisma.comment.findMany({
      where: {
        article: { slug },
        parentId: parentId || null,
        ...(showAll ? {} : { isApproved: true, isSpam: false })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: { 
            replies: { 
              where: showAll ? {} : { isApproved: true, isSpam: false } 
            } 
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to comment' },
        { status: 401 }
      );
    }

    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimit = await commentLimiter.check(10, ip); // 10 requests per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rateLimit.reset / 1000) } }
      );
    }

    const { slug } = await params;
    const { content, parentId } = await request.json();

    // Input validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check comment length
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Check if user is not banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true }
    });

    if (user?.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been banned from posting comments' },
        { status: 403 }
      );
    }

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { 
        slug,
        status: 'PUBLISHED' // Only allow comments on published articles
      },
      select: { 
        id: true,
        allowComments: true
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found or not published' },
        { status: 404 }
      );
    }

    if (!article.allowComments) {
      return NextResponse.json(
        { error: 'Comments are disabled for this article' },
        { status: 403 }
      );
    }

    // If this is a reply, check if parent comment exists and belongs to the same article
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { 
          id: parentId,
          articleId: article.id
        },
        select: { 
          id: true,
          // Prevent deep nesting of comments
          parentId: true 
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      // Prevent deep nesting (only allow one level of replies)
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: 'Cannot reply to a reply' },
          { status: 400 }
        );
      }
    }

    // Check for spam
    const spamCheck = isSpam(content);
    
    // For new users, moderate comments more strictly
    const userCommentCount = await prisma.comment.count({
      where: { authorId: session.user.id }
    });
    
    const isNewUser = userCommentCount < 3; // First 3 comments are moderated
    const isApproved = !isNewUser && !spamCheck;

    // Get user agent and IP for moderation
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = getClientIp(request);

    const comment = await prisma.comment.create({
      data: {
        content,
        isApproved,
        isSpam: spamCheck,
        userAgent,
        ipAddress,
        article: {
          connect: { id: article.id },
        },
        author: {
          connect: { id: session.user.id },
        },
        ...(parentId && {
          parent: {
            connect: { id: parentId },
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
