// app/api/upload/route.js
import { uploadFile } from '@/lib/file-upload';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadFile(file, {
      provider: process.env.STORAGE_PROVIDER || 's3',
        folder: 'article-covers',
      compression: {
              maxSizeMB: 1,
              maxWidthOrHeight: 2000,
              useWebWorker: true,
            },
    });
      console.log( "File result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}