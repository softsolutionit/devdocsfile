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
    const { isActive } = await request.json();

    // Prevent changing your own status
    if (session.user.id === id) {
      return new NextResponse('Cannot change your own status', { status: 400 });
    }

    // Get current user status for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Update user status
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
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
        action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        userId: session.user.id,
        targetId: user.id,
        targetType: 'USER',
        metadata: {
          previousStatus: currentUser.isActive,
          newStatus: isActive,
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    
    if (error.code === 'P2025') {
      return new NextResponse('User not found', { status: 404 });
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
