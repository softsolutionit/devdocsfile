import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
          },
        },
        tags: true,
        _count: {
          select: {
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.article.update({
      where: { id: article.id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to update an article' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const { title, content, excerpt, tags, status } = await request.json();

    // Check if article exists and user is the author
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      select: { authorId: true },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (existingArticle.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this article' },
        { status: 403 }
      );
    }

    // Create or connect tags
    const tagConnections = tags?.map((tag) => ({
      where: { slug: tag.toLowerCase().replace(/\s+/g, '-') },
      create: {
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-'),
      },
    })) || [];

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(excerpt && { excerpt }),
        ...(status && { status }),
        ...(tags && {
          tags: {
            set: [],
            connectOrCreate: tagConnections,
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
        tags: true,
      },
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to delete an article' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Check if article exists and user is the author or admin
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      select: { authorId: true },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (existingArticle.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You are not authorized to delete this article' },
        { status: 403 }
      );
    }

    await prisma.article.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
