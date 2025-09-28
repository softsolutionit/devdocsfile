import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to bookmark articles' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        articleId: article.id,
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Article already bookmarked' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        user: {
          connect: { id: session.user.id },
        },
        article: {
          connect: { id: article.id },
        },
      },
      include: {
        article: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to remove bookmarks' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Delete bookmark
    await prisma.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        articleId: article.id,
      },
    });

    return NextResponse.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view bookmarks' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if bookmark exists
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        articleId: article.id,
      },
    });

    return NextResponse.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
      { status: 500 }
    );
  }
}
