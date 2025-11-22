const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Resize and optimize image
 * @param {string} imagePath - Path to the uploaded image
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - JPEG quality 1-100 (default: 85)
 * @returns {Promise<string>} - Path to the resized image
 */
async function resizeImage(imagePath, maxWidth = 800, maxHeight = 800, quality = 85) {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }

    // Get file extension
    const ext = path.extname(imagePath).toLowerCase();
    const isJpeg = ['.jpg', '.jpeg'].includes(ext);
    const isPng = ext === '.png';
    const isGif = ext === '.gif';

    // Read image metadata
    const metadata = await sharp(imagePath).metadata();
    
    // If image is already smaller than max dimensions, just optimize it
    if (metadata.width <= maxWidth && metadata.height <= maxHeight) {
      // Optimize without resizing
      await sharp(imagePath)
        .jpeg({ quality: isJpeg ? quality : undefined })
        .png({ quality: isPng ? quality : undefined, compressionLevel: 9 })
        .toFile(imagePath + '.tmp');
      
      // Replace original with optimized version
      fs.renameSync(imagePath + '.tmp', imagePath);
      return imagePath;
    }

    // Resize image maintaining aspect ratio
    const resizedImage = await sharp(imagePath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: isJpeg ? quality : undefined })
      .png({ quality: isPng ? quality : undefined, compressionLevel: 9 })
      .toBuffer();

    // Write resized image back to the same path
    fs.writeFileSync(imagePath, resizedImage);
    
    return imagePath;
  } catch (error) {
    console.error('Error resizing image:', error);
    // If sharp fails, return original path (graceful degradation)
    return imagePath;
  }
}

/**
 * Resize multiple images
 * @param {Array} files - Array of multer file objects
 * @returns {Promise<Array>} - Array of image paths
 */
async function resizeImages(files) {
  if (!files || files.length === 0) return [];
  
  const resizePromises = files.map(file => {
    const filePath = file.path;
    return resizeImage(filePath);
  });

  try {
    await Promise.all(resizePromises);
    return files.map(file => file.path);
  } catch (error) {
    console.error('Error resizing images:', error);
    // Return original paths even if resize fails
    return files.map(file => file.path);
  }
}

module.exports = { resizeImage, resizeImages };

