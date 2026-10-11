import cloudinaryPackage from 'cloudinary';
const cloudinary = cloudinaryPackage.v2;

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
  console.warn('⚠️ [CLOUDINARY] Credentials are missing. Image uploads will fail until configured.');
}

/** Upload a local temporary image file and return its Cloudinary HTTPS URL. */
const uploadToCloudinary = async (filePath, folder = 'campusfind/posts') => {
  if (!isConfigured) {
    const error = new Error('Image uploads are unavailable because Cloudinary is not configured.');
    error.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw error;
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  });

  if (!result.secure_url) throw new Error('Cloudinary did not return a secure image URL.');
  return result.secure_url;
};

export { uploadToCloudinary, isConfigured };
