import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { commentId } = params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ liked: false });
    }

    // Check if comment exists and is approved
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        isApproved: true,
        isSpam: false
      },
      select: { 
        id: true,
        likes: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or not approved' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      liked: comment.likes.length > 0 
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' }, 
      { status: 500 }
    );
  }
}
