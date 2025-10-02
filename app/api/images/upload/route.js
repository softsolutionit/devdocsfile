
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create user directory if it doesn't exist
    const userId = session.user.id;
    const uploadDir = join(process.cwd(), 'public', 'articles', 'images', userId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename with timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}-${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Return the relative URL
    const imageUrl = `/articles/images/${userId}/${fileName}`;

    return new Response(JSON.stringify({ url: imageUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(JSON.stringify({ error: 'Error uploading image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  console.log('DELETE request received');
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'No image URL provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate that the image belongs to the user
    const userId = session.user.id;
    if (!imageUrl.includes(`/articles/images/${userId}/`)) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete this image' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert URL to filesystem path
    const fileName = imageUrl.split('/').pop();
    const filePath = join(process.cwd(), 'public', 'articles', 'images', userId, fileName);

    // Delete the file
    try {
      await unlink(filePath);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return new Response(JSON.stringify({ error: 'File not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return new Response(JSON.stringify({ error: 'Error deleting image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
