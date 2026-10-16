import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const adminOnly = [authenticate, requireRole('admin')];

router.get('/users', ...adminOnly, admin.listUsers);
router.post('/users', ...adminOnly, admin.createUser);
router.patch('/users/:id', ...adminOnly, admin.updateUser);
router.get('/stats', ...adminOnly, admin.getStats);

export default router;
