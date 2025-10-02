import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const authorId = searchParams.get('authorId');
    const tag = searchParams.get('tag');

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(authorId && { authorId }),
      ...(tag && {
        tags: {
          some: {
            slug: tag,
          },
        },
      }),
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      data: articles,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to create an article' },
        { status: 401 }
      );
    }

    const { title, content, excerpt, tags, status = 'DRAFT', coverImage, slug: customSlug } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const baseSlug = customSlug || title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');

    // Get the author's username
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true }
    });

    if (!author?.username) {
      return NextResponse.json(
        { error: 'User must have a username to create articles' },
        { status: 400 }
      );
    }

    // Check if an article with the same slug already exists for this user
    const existingArticle = await prisma.article.findFirst({
      where: {
        authorUsername: author.username,
        slug: baseSlug,
      },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this URL already exists in your profile' },
        { status: 409 }
      );
    }

    // Create or connect tags
    const tagConnections = (Array.isArray(tags) ? tags : [])
      .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
      .map((tag) => ({
        tag: {
          connectOrCreate: {
            where: { name: tag },
            create: {
              name: tag,
              slug: tag.toLowerCase().replace(/\s+/g, '-'),
            },
          },
        },
      })) || [];

    const article = await prisma.article.create({
      data: {
        title,
        slug: baseSlug,
        authorUsername: author.username,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        status,
        coverImage: coverImage || null,
        author: {
          connect: { id: session.user.id },
        },
        tags: {
          create: tagConnections,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        tags: true,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An article with this title already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
