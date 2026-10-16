import { Router } from 'express';
import * as assignment from '../controllers/assignmentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadAttachments } from '../middleware/upload.js';

// Mounted at /api, so the paths below include the "courses" or "assignments" prefix.
// requireRole runs before the upload middleware so unauthorized users cannot store files.
const router = Router();
const staff = requireRole('teacher', 'admin');

router.get('/courses/:courseId/assignments', authenticate, assignment.listAssignments);
router.post('/courses/:courseId/assignments', authenticate, staff, uploadAttachments, assignment.createAssignment);
router.get('/assignments/:id', authenticate, assignment.getAssignment);
router.patch('/assignments/:id', authenticate, staff, uploadAttachments, assignment.updateAssignment);
router.delete('/assignments/:id', authenticate, staff, assignment.deleteAssignment);

export default router;
