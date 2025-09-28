import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    const { role } = await request.json();

    // Validate role
    if (!['ADMIN', 'MODERATOR', 'USER'].includes(role)) {
      return new NextResponse('Invalid role', { status: 400 });
    }

    // Prevent changing your own role
    if (session.user.id === id) {
      return new NextResponse('Cannot change your own role', { status: 400 });
    }

    // Update user role
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Log this action in audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_ROLE_UPDATED',
        userId: session.user.id,
        targetId: user.id,
        targetType: 'USER',
        metadata: {
          oldRole: user.role,
          newRole: role,
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error.code === 'P2025') {
      return new NextResponse('User not found', { status: 404 });
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
