import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from '../middleware/upload.js';

// Deletes uploaded files from disk. Missing files are ignored.
export const removeFiles = async (files = []) => {
  await Promise.all(
    files.map((f) => fs.unlink(path.join(UPLOAD_DIR, f.filename)).catch(() => {}))
  );
};
