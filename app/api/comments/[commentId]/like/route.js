import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getClientIp } from 'request-ip';
import { RateLimiter } from '@/lib/rate-limiter';

// Initialize rate limiter: 60 likes per minute per IP
const likeLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function POST(request, { params }) {
  try {
    const { commentId } = params;
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'You must be logged in to like comments' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = await likeLimiter.check(60, ip); // 60 likes per minute per IP

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Retry-After': Math.ceil(rateLimit.reset / 1000),
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // Check if comment exists and is approved
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        isApproved: true,
        isSpam: false
      },
      select: { id: true }
    });

    if (!comment) {
      return new NextResponse(
        JSON.stringify({ error: 'Comment not found or not approved' }), 
        { status: 404 }
      );
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: comment.id
        }
      }
    });

    if (existingLike) {
      return new NextResponse(
        JSON.stringify({ error: 'You have already liked this comment' }), 
        { status: 400 }
      );
    }

    // Create the like
    const [like, updatedComment] = await prisma.$transaction([
      prisma.commentLike.create({
        data: {
          user: { connect: { id: session.user.id } },
          comment: { connect: { id: comment.id } },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || ''
        }
      }),
      prisma.comment.update({
        where: { id: comment.id },
        data: { likesCount: { increment: 1 } },
        select: { likesCount: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      likesCount: updatedComment.likesCount
    });

  } catch (error) {
    console.error('Error liking comment:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to like comment' }), 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { commentId } = params;
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'You must be logged in to unlike comments' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the like to delete
    const like = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId
        }
      },
      select: { id: true }
    });

    if (!like) {
      return new NextResponse(
        JSON.stringify({ error: 'Like not found' }), 
        { status: 404 }
      );
    }

    // Delete the like and update the count in a transaction
    const [_, updatedComment] = await prisma.$transaction([
      prisma.commentLike.delete({
        where: { id: like.id }
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { 
          likesCount: { 
            decrement: 1 
          } 
        },
        select: { likesCount: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      likesCount: Math.max(0, updatedComment.likesCount) // Ensure it doesn't go below 0
    });

  } catch (error) {
    console.error('Error unliking comment:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to unlike comment' }), 
      { status: 500 }
    );
  }
}
