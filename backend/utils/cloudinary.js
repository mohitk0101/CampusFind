const cloudinary = require('cloudinary').v2;

// Check if Cloudinary environment variables are set
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('☁️ [CLOUDINARY] Cloudinary initialized successfully');
} else {
  console.log('ℹ️ [CLOUDINARY] Environment variables not set. Falling back to inline image storage.');
}

/**
 * Uploads a base64 image or URL to Cloudinary.
 * If already a remote URL or if Cloudinary is not configured, returns the input as-is.
 * 
 * @param {string} fileData - Base64 data string or existing URL
 * @param {string} folder - Target Cloudinary folder
 * @returns {Promise<string>} - HTTPS secure URL from Cloudinary or fallback string
 */
const uploadToCloudinary = async (fileData, folder = 'campusfind/posts') => {
  if (!fileData) return null;

  // Already hosted on a remote server/CDN
  if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
    return fileData;
  }

  // If Cloudinary is not configured, gracefully fallback to storing the string
  if (!isConfigured) {
    return fileData;
  }

  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' } // Cloudinary automatic format & compression
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('❌ [CLOUDINARY ERROR] Upload failed:', error.message);
    // Fallback gracefully so post creation doesn't fail if Cloudinary has a temporary network glitch
    return fileData;
  }
};

module.exports = {
  uploadToCloudinary,
  isConfigured
};
