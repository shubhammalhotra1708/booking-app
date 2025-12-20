/**
 * Image Upload Utilities
 * Handles image compression, upload to Supabase Storage, and URL management
 */

import imageCompression from 'browser-image-compression';
import { createClient } from '@/utils/supabase/client';

/**
 * Compress image before upload
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 0.5, // 500KB max
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp', // Convert to WebP for best compression
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Upload image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within bucket
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImage(file, bucket, path) {
  const supabase = createClient();

  try {
    // Compress image before upload
    const compressedFile = await compressImage(file);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, compressedFile, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} url - Full public URL of the image
 * @returns {Promise<boolean>} Success status
 */
export async function deleteImage(url) {
  const supabase = createClient();

  try {
    // Extract bucket and path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.webp
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid storage URL format');
    }

    const [bucket, ...pathParts] = urlParts[1].split('/');
    const path = pathParts.join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  } = options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, or WebP.' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File too large. Maximum size is ${maxSizeMB}MB.` };
  }

  return { valid: true, error: null };
}
