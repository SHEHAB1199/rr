// cloudinaryUpload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log("Received file:", file.originalname, file.mimetype, "Size:", file.size, "bytes");

        const isImage = file.mimetype.startsWith('image/');
        const isZip = file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed';

        if (isImage) {
            return {
                folder: 'orders/images',
                resource_type: 'image',
            };
        } else if (isZip) {
            return {
                folder: 'orders/zips',
                resource_type: 'raw',
                use_filename: true,
                unique_filename: false,
            };
        }

        throw new Error('Unsupported file type: ' + file.mimetype);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 40 * 1024 * 1024, // 5MB limit
    },
}).fields([{ name: 'media', maxCount: 10 }]);

const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).json({ error: `Multer Error: ${err.message}` });
    } else if (err) {
        console.error('File Upload Error:', err, err.stack);
        const errorMessage = err.message || 'Unknown error during file upload';
        return res.status(400).json({ error: `File Upload Error: ${errorMessage}` });
    }
    next();
};

module.exports = { upload, multerErrorHandler };