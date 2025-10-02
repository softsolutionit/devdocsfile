import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params: { id: articleId } }) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params: { id: articleId } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, slug, excerpt, content, coverImage, tags = [], status } = await request.json();

    // Check if the article exists and belongs to the user
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { authorUsername: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (existingArticle.authorUsername !== session.user.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the slug is already taken by another article
    if (slug !== existingArticle.slug) {
      const slugExists = await prisma.article.findFirst({
        where: {
          slug,
          authorUsername: session.user.username,
          id: { not: articleId },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'An article with this URL already exists in your profile' },
          { status: 409 }
        );
      }
    }

    // Process tags
    const tagConnections = (Array.isArray(tags) ? tags : [])
      .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
      .map((tag) => ({
        tag: {
          connectOrCreate: {
            where: { name: tag },
            create: {
              name: tag,
              slug: tag.toLowerCase().replace(/\s+/g, '-')
            }
          }
        }
      })) || [];

    // Update the article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title,
        slug,
        excerpt: excerpt || content.substring(0, 200) + '...',
        coverImage,
        status,
        updatedAt: new Date(),
        tags: {
          set: [], // Clear existing tags
          create: tagConnections,
        },
      },
      include: {
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
