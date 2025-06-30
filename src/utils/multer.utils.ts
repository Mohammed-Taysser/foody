import fs from 'fs';
import path from 'path';

import multer from 'multer';
import sharp from 'sharp';

import dayjsTZ from './dayjs.utils';

const ALLOWED_IMAGES_TYPE = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for further processing
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_IMAGES_TYPE?.includes(file.mimetype)) {
      return callback(new Error('Only image files are allowed'));
    }
    callback(null, true);
  },
});

async function uploadImage(file: Express.Multer.File, module: AppModules) {
  if (!file) throw new Error('No file provided');

  const formattedDateTime = dayjsTZ().format('YYYY-MM-DD-HH-mm-ss');
  const extension = 'png';
  const fileName = `${formattedDateTime}.${extension}`;

  // Determine the upload directory
  const uploadPath = path.join(__dirname, '../../uploads', module);

  // Ensure the directory exists
  await fs.promises.mkdir(uploadPath, { recursive: true });

  // Full file path
  const filePath = path.join(uploadPath, fileName);

  // Process and save the image
  await sharp(file.buffer).resize(800).toFormat('png').png({ quality: 70 }).toFile(filePath);

  // Return relative path for storage in DB
  return path.join('/uploads', module, fileName);
}

function deleteImage(filename: string) {
  // Determine the upload directory
  const uploadPath = path.join(__dirname, '../../', filename);

  if (fs.existsSync(uploadPath)) {
    fs.unlinkSync(uploadPath);
  }
}

export { deleteImage, upload, uploadImage };
