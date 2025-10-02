import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to like articles' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        articleId: id,
        userId: session.user.id,
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Article already liked' },
        { status: 400 }
      );
    }

    // Create like
    const like = await prisma.like.create({
      data: {
        articleId: id,
        userId: session.user.id,
      },
    });

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { articleId: id },
    });

    return NextResponse.json({ 
      data: { 
        like,
        likeCount 
      } 
    });
  } catch (error) {
    console.error('Error liking article:', error);
    return NextResponse.json(
      { error: 'Failed to like article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to unlike articles' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete like
    await prisma.like.deleteMany({
      where: {
        articleId: id,
        userId: session.user.id,
      },
    });

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { articleId: id },
    });

    return NextResponse.json({ 
      data: { 
        likeCount 
      } 
    });
  } catch (error) {
    console.error('Error unliking article:', error);
    return NextResponse.json(
      { error: 'Failed to unlike article' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to check like status' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if liked
    const like = await prisma.like.findFirst({
      where: {
        articleId: id,
        userId: session.user.id,
      },
    });

    // Get like count
    const likeCount = await prisma.like.count({
      where: { articleId: id },
    });

    return NextResponse.json({ 
      data: { 
        isLiked: !!like,
        likeCount 
      } 
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}
