/**
 * Compress and resize image before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 800)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image as Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image with white background for JPEGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload compressed image to storage
 * @param file - The image file to upload
 * @param path - Storage path (without bucket name)
 * @returns Public URL of uploaded image
 */
export async function uploadStudentPhoto(
  file: File,
  userId: string
): Promise<string> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Compress image before upload
  const compressedBlob = await compressImage(file);
  
  // Generate unique filename
  const fileExt = 'jpg'; // Always save as JPEG after compression
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('student-photos')
    .upload(filePath, compressedBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data } = supabase.storage
    .from('student-photos')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Delete student photo from storage
 * @param photoUrl - The full URL of the photo to delete
 */
export async function deleteStudentPhoto(photoUrl: string): Promise<void> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Extract file path from URL
  const urlParts = photoUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  if (fileName && fileName !== 'default-avatar.png') {
    await supabase.storage
      .from('student-photos')
      .remove([fileName]);
  }
}
