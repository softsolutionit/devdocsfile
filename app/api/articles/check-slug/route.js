// app/api/articles/check-slug/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const username = searchParams.get('username');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // First, find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if an article with this slug already exists for this user
    const existingArticle = await prisma.article.findFirst({
      where: {
        slug,
        author: {
          username: username
        }
      },
      select: { 
        id: true,
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json({
      available: !existingArticle,
      message: existingArticle 
        ? `This URL is already used in your profile`
        : 'URL is available'
    });

  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check slug availability',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}