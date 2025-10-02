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

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        articleId: id,
        userId: session.user.id,
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Article already bookmarked' },
        { status: 400 }
      );
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        articleId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ data: bookmark });
  } catch (error) {
    console.error('Error bookmarking article:', error);
    return NextResponse.json(
      { error: 'Failed to bookmark article' },
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

    const { id } = await params;

    // Delete bookmark
    await prisma.bookmark.deleteMany({
      where: {
        articleId: id,
        userId: session.user.id,
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
        { error: 'You must be signed in to check bookmark status' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if bookmarked
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        articleId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
      { status: 500 }
    );
  }
}
