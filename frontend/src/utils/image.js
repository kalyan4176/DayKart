/**
 * Helper to dynamically optimize image URLs on the frontend.
 * Applies width scaling and auto-format/quality parameters for Cloudinary and Unsplash.
 *
 * @param {string} url - The original image URL
 * @param {number} width - The target width (default 400)
 * @returns {string} The optimized image URL
 */
export const getOptimizedImageUrl = (url, width = 400) => {
  if (!url) return '';

  // 1. Optimize Cloudinary URLs
  if (url.includes('res.cloudinary.com')) {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
      const afterUpload = url.substring(uploadIndex + 8);
      // c_scale: scale to width, q_auto: automatic quality compression, f_auto: next-gen WebP formatting
      return `${beforeUpload}c_scale,w_${width},q_auto,f_auto/${afterUpload}`;
    }
  }

  // 2. Optimize Unsplash URLs
  if (url.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('w', width.toString());
      parsedUrl.searchParams.set('q', '65'); // High-quality compression
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', 'crop');
      return parsedUrl.toString();
    } catch (e) {
      return url;
    }
  }

  return url;
};
