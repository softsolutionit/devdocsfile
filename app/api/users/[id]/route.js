import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    const userId = params.id;

    // Verify the user is authenticated and updating their own profile
    if (!session || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const username = formData.get('username');
    const bio = formData.get('bio');
    const imageFile = formData.get('image');
    const removeImage = formData.get('removeImage') === 'true';

    // Check if username is being updated and validate it
    if (username && username !== session.user.username) {
      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }

      // Update username in articles if needed
      await prisma.article.updateMany({
        where: { authorId: userId },
        data: { authorUsername: username },
      });
    }

    let imageUrl = session.user.image;
    
    // Handle profile picture update
    if (removeImage) {
      // If user wants to remove their OAuth image, set to null
      imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
      // If a new image is uploaded
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate a unique filename
      const filename = `${uuidv4()}-${imageFile.name}`;
      const publicPath = join(process.cwd(), 'public', 'users', filename);
      
      // Ensure the users directory exists
      const fs = require('fs');
      const usersDir = join(process.cwd(), 'public', 'users');
      if (!fs.existsSync(usersDir)) {
        fs.mkdirSync(usersDir, { recursive: true });
      }
      
      // Save the new file
      await writeFile(publicPath, buffer);
      imageUrl = `/users/${filename}`;
      
      // Delete old profile picture if it exists and is not from OAuth
      const oldImage = session.user.image;
      if (oldImage && !oldImage.startsWith('http')) {
        try {
          const oldImagePath = join(process.cwd(), 'public', oldImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error removing old profile picture:', error);
        }
      }
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(bio !== null && { bio }), // Allow empty bio
        ...(imageUrl && { image: imageUrl }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
