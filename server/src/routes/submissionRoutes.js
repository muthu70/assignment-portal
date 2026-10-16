import { Router } from 'express';
import * as submission from '../controllers/submissionController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadSubmission } from '../middleware/upload.js';

const router = Router();
const staff = requireRole('teacher', 'admin');

router.post('/assignments/:id/submit', authenticate, requireRole('student'), uploadSubmission, submission.submitAssignment);
router.get('/assignments/:id/my-submission', authenticate, requireRole('student'), submission.getMySubmission);
router.get('/assignments/:id/submissions', authenticate, staff, submission.listSubmissions);
router.post('/assignments/:id/release-grades', authenticate, staff, submission.releaseGrades);
router.patch('/submissions/:id/grade', authenticate, staff, submission.gradeSubmission);

export default router;
