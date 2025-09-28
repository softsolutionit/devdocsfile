// app/api/articles/check-slug/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Check if an article with this slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    return NextResponse.json({
      available: !existingArticle
    });

  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json(
      { error: 'Failed to check slug availability' },
      { status: 500 }
    );
  }
}