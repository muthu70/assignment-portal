import { Router } from 'express';
import { downloadFile } from '../controllers/fileController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:filename', authenticate, downloadFile);

export default router;
