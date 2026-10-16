import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.zip', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(`File type ${ext || 'unknown'} is not allowed`);
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

const options = { storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } };

export const uploadAttachments = multer(options).array('attachments', 5);
export const uploadSubmission = multer(options).array('files', 5);

export const toFileMeta = (file) => ({
  originalName: file.originalname,
  filename: file.filename,
  size: file.size,
  mimetype: file.mimetype,
});
