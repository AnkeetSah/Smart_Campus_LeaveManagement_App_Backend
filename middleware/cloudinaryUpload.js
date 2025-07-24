import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import path from 'path';
import multer from 'multer';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const userId = req.user._id.toString(); // assuming user is authenticated
    const ext = path.extname(file.originalname); // .jpg or .pdf
    const name = path.basename(file.originalname, ext); // doctor-note
    const timestamp = Date.now();

    return {
      folder: 'leave_attachments',
      format: ext.replace('.', ''), // remove dot for Cloudinary
      public_id: `${userId}_${timestamp}_${name}`.replace(/\s+/g, '-'),
    };
  },
});




const upload = multer({ storage });

export default upload;
