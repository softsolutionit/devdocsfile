// app/api/upload/route.js
import { uploadFile } from '@/lib/file-upload';
import { NextResponse } from 'next/server';
import { uploadFileR2 } from '@/lib/cloudflare-r2';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const provider = formData.get('provider') || 'r2';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (provider === 'r2') {
      const result = await uploadFileR2(file, {
        provider: provider,
          folder: 'article-covers',
        compression: {
                maxSizeMB: 1,
                maxWidthOrHeight: 2000,
                useWebWorker: true,
              },
      });
        console.log( "File result:", result);
  
      return NextResponse.json(result);
      
    } else {
      const result = await uploadFile(file, {
        provider: provider,
          folder: 'article-covers',
        compression: {
                maxSizeMB: 1,
                maxWidthOrHeight: 2000,
                useWebWorker: true,
              },
      });
        console.log( "File result:", result);
  
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}