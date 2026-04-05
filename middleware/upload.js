const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ── Cloudinary storage — products folder ──────────────────────────────────────
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'cracker_shop/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// ── Cloudinary storage — categories folder ────────────────────────────────────
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'cracker_shop/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

// Max 5 images, 5MB each
const uploadProductImages = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 5);

const uploadCategoryImage = multer({
  storage: categoryStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('image');

// ── Helper: delete image from Cloudinary by URL ───────────────────────────────
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123456/cracker_shop/products/filename.jpg
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;
    // public_id is everything after /upload/v<version>/ without extension
    const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// ── Middleware wrapper (handles multer errors gracefully) ─────────────────────
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadProductImages: handleUpload(uploadProductImages),
  uploadCategoryImage: handleUpload(uploadCategoryImage),
  deleteCloudinaryImage,
};