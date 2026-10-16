import { Router } from 'express';
import * as course from '../controllers/courseController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const staff = requireRole('teacher', 'admin');

router.get('/', authenticate, course.listCourses);
router.post('/', authenticate, staff, course.createCourse);
router.post('/join', authenticate, requireRole('student'), course.joinCourse);
router.get('/:id', authenticate, course.getCourse);
router.patch('/:id', authenticate, staff, course.updateCourse);
router.delete('/:id', authenticate, staff, course.deleteCourse);
router.post('/:id/students', authenticate, staff, course.addStudent);
router.delete('/:id/students/:studentId', authenticate, staff, course.removeStudent);

export default router;
