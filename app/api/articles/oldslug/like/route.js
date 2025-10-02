import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'You must be logged in to like an article' }), 
        { status: 401 }
      );
    }

    const { slug } = await params;
    const userId = session.user.id;

    // Find the article by slug
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      return new NextResponse(
        JSON.stringify({ error: 'Article not found' }), 
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id
        }
      }
    });

    if (existingLike) {
      // Unlike the article
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      });

      // Decrement like count
      await prisma.article.update({
        where: { id: article.id },
        data: {
          likesCount: { decrement: 1 }
        }
      });

      return NextResponse.json({ liked: false });
    }

    // Like the article
    await prisma.like.create({
      data: {
        userId,
        articleId: article.id
      }
    });

    // Increment like count
    await prisma.article.update({
      where: { id: article.id },
      data: {
        likesCount: { increment: 1 }
      }
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Error toggling like:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to process like' }), 
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Find the article by slug
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true, likesCount: true }
    });

    if (!article) {
      return new NextResponse(
        JSON.stringify({ error: 'Article not found' }), 
        { status: 404 }
      );
    }

    let isLiked = false;
    if (userId) {
      // Check if the current user has liked the article
      const like = await prisma.like.findUnique({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id
          }
        }
      });
      isLiked = !!like;
    }

    return NextResponse.json({
      likesCount: article.likesCount || 0,
      isLiked
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get like status' }), 
      { status: 500 }
    );
  }
}
