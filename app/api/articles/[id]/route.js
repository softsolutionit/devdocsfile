import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const article = await prisma.article.findUnique({
      where: { id },
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

    return NextResponse.json({ data: article });
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
        { error: 'You must be signed in to update articles' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { title, content, excerpt, status, tags = [] } = await request.json();

    // Check if article exists and user is the author
    const existingArticle = await prisma.article.findUnique({
      where: { id },
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

    // Update article
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        title,
        content,
        excerpt,
        status,
        tags: {
          set: [], // Clear existing tags
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag.toLowerCase() },
            create: { name: tag.toLowerCase() },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({ data: updatedArticle });
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
        { error: 'You must be signed in to delete articles' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if article exists and user is the author
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (article.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this article' },
        { status: 403 }
      );
    }

    // Delete article
    await prisma.article.delete({
      where: { id },
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
