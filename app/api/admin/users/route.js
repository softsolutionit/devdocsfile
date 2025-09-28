import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: searchConditions,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: searchConditions }),
    ]);

    // Format dates for display
    const formattedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      emailVerified: user.emailVerified?.toISOString() || null,
    }));

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, email, password, role = 'USER' } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse('User already exists', { status: 400 });
    }

    // In a real app, you would hash the password here
    // For now, we'll just store it as is (NOT RECOMMENDED FOR PRODUCTION)
    const hashedPassword = password; // In production, use bcrypt.hash()

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // In a real app, you would send a verification email here

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
