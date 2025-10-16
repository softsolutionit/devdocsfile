import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

// Default compression options
const defaultImageCompressionOptions = {
  maxSizeMB: 1, // Max size in MB
  maxWidthOrHeight: 2000,
  useWebWorker: true,
  maxIteration: 10,
};

// File type validation
const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;


const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_BUCKET_PUBLIC_URL;

// Initialize S3 client if AWS credentials are provided
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

/**
 * Validates a file against allowed types and size
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} [options.maxSize=MAX_FILE_SIZE] - Maximum file size in bytes
 * @param {string[]} [options.allowedTypes] - Allowed MIME types
 * @throws {Error} If validation fails
 */
export function validateFile(file, { maxSize = MAX_FILE_SIZE, allowedTypes } = {}) {
  if (!file) throw new Error('No file provided');
  
  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB`);
  }
  
  // Check file type
  const allowed = allowedTypes || Object.keys(ALLOWED_FILE_TYPES);
  if (!allowed.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowed.join(', ')}`);
  }
  
  return true;
}

/**
 * Compresses an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
async function compressImage(file, options = {}) {
  // Skip compression in Node.js environment
  if (typeof window === 'undefined') {
    return file;
  }

  if (!file.type?.startsWith('image/')) {
    return file;
  }
  
  try {
    const compressionOptions = { ...defaultImageCompressionOptions, ...options };
    return await imageCompression(file, compressionOptions);
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}

/**
 * Upload a file to the specified storage provider
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @param {'s3'|'cloudinary'|'vps'} [options.provider='s3'] - Storage provider
 * @param {string} [options.folder='uploads'] - Folder path in storage
 * @param {Function} [options.onProgress] - Progress callback (0-100)
 * @param {Object} [options.compression] - Image compression options
 * @returns {Promise<{url: string, key: string, size: number, type: string}>} - Upload result
 */
export async function uploadFileR2(
  file,
  { 
    provider = 'r2', 
    folder = 'uploads',
    onProgress,
    compression
  } = {}
) {
  if (!file) throw new Error('No file provided');
  
  // Validate file first
  validateFile(file);
  
  try {
    let processedFile = file;
    
    // Compress if it's an image
    if (file.type.startsWith('image/')) {
      processedFile = await compressImage(file, compression);
    }
    
    const fileExt = ALLOWED_FILE_TYPES[processedFile.type] || 
                   processedFile.name.split('.').pop() || 'bin';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${Date.now()}-${fileName}`;
    
    // Convert to buffer
    const arrayBuffer = await processedFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Upload to the selected provider
    let result;
    switch (provider.toLowerCase()) {
      case 'r2':
        result = await uploadToR2(fileBuffer, filePath, processedFile.type, onProgress);
        break;
      case 'cloudinary':
        result = await uploadToCloudinary(fileBuffer, filePath, processedFile.type, onProgress);
        break;
      case 'vps':
        result = await uploadToVPS(fileBuffer, filePath, processedFile.type, onProgress);
        break;
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
    
    return {
      ...result,
      size: fileBuffer.length,
      type: processedFile.type,
      originalName: file.name,
      originalSize: file.size
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Check if a file exists in storage
 * @param {string} key - The file key/path in storage
 * @param {Object} options - Options
 * @param {'s3'|'cloudinary'|'vps'} [options.provider='s3'] - Storage provider
 * @returns {Promise<boolean>} - Whether the file exists
 */
export async function fileExists(key, { provider = 's3' } = {}) {
  try {
    if (provider === 'r2') {
      if (!s3Client) throw new Error('R2 client not configured');
      
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });
      
      await s3Client.send(command);
      return true;
    }
    
    // Implement for other providers as needed
    return false;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    console.error('Error checking file existence:', error);
    throw error;
  }
}

/**
 * Upload file to R2
 * @private
 */
async function uploadToR2(buffer, filePath, contentType, onProgress) {
  if (!s3Client) throw new Error('R2 client not configured');
  
  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: filePath,
    Body: buffer,
    ContentType: contentType,
    // Note: ACLs are not used - bucket policies should be used for access control
    CacheControl: 'public, max-age=31536000', // 1 year cache
  };
  
  try {
    const command = new PutObjectCommand(params);
    
    // Upload with progress tracking if callback provided
    if (typeof onProgress === 'function') {
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate progress for small files
      if (buffer.length < 1024 * 1024) { // < 1MB
        onProgress(50);
        await s3Client.send(command);
        onProgress(100);
      } else {
        // For larger files, we'd need to use S3's multipart upload for real progress
        // This is a simplified version
        await s3Client.send(command);
        onProgress(100);
      }
    } else {
      await s3Client.send(command);
    }
    
    // Construct the URL
    const region = 'auto';
    let url;
    
    // Handle S3-compatible storage with custom endpoint
    if (R2_ENDPOINT) {
      const endpoint = R2_ENDPOINT
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/\/$/, ''); // Remove trailing slash
      url = `${R2_PUBLIC_URL}/${filePath}`;
    } else {
      // Standard R2 URL
      url = `${R2_PUBLIC_URL}/${filePath}`;
    }
    
    return {
      url,
      key: filePath,
      provider: 's3',
    };
    
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Upload file to Cloudinary
 * @private
 */
async function uploadToCloudinary(buffer, filePath, contentType, onProgress) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }
  
  const formData = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  
  formData.append('file', blob);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default');
  formData.append('folder', filePath.split('/').slice(0, -1).join('/'));
  
  // Add optimization parameters
  formData.append('quality', 'auto:good');
  formData.append('fetch_format', 'auto');
  
  try {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }
    
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
        true
      );
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.secure_url,
            key: data.public_id,
            provider: 'cloudinary',
            format: data.format,
            bytes: data.bytes,
            width: data.width,
            height: data.height,
          });
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during Cloudinary upload'));
      };
      
      xhr.send(formData);
    });
    
    return await uploadPromise;
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

/**
 * Upload file to VPS via API
 * @private
 */
async function uploadToVPS(buffer, filePath, contentType, onProgress) {
  if (!process.env.VPS_UPLOAD_URL) {
    throw new Error('VPS upload URL not configured');
  }
  
  const formData = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  formData.append('file', blob, filePath.split('/').pop());
  
  // Add metadata
  formData.append('filename', filePath.split('/').pop());
  formData.append('contentType', contentType);
  formData.append('folder', filePath.split('/').slice(0, -1).join('/'));
  
  try {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }
    
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.open('POST', process.env.VPS_UPLOAD_URL, true);
      
      // Add authorization if provided
      if (process.env.VPS_API_KEY) {
        xhr.setRequestHeader('Authorization', `Bearer ${process.env.VPS_API_KEY}`);
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.url || `${process.env.VPS_BASE_URL || ''}/${filePath}`,
              key: data.key || filePath,
              provider: 'vps',
              ...data.metadata
            });
          } catch (e) {
            // If response is not JSON, assume it's a direct URL
            if (xhr.responseText.startsWith('http')) {
              resolve({
                url: xhr.responseText,
                key: filePath,
                provider: 'vps'
              });
            } else {
              reject(new Error('Invalid response from server'));
            }
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };
      
      xhr.send(formData);
    });
    
    return await uploadPromise;
    
  } catch (error) {
    console.error('VPS upload error:', error);
    throw new Error(`VPS upload failed: ${error.message}`);
  }
}

// validateFile has been moved to the top of the file for better organization
