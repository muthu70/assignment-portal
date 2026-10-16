import Course from '../models/Course.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isStaffOf, isMemberOf, isEnrolled } from '../utils/access.js';
import { removeFiles } from '../utils/files.js';

// Students should not see the join code, since it is only shared with them by a teacher.
const formatCourse = (user, course) => {
  const obj = course.toObject();
  if (user.role === 'student') delete obj.joinCode;
  return obj;
};

export const listCourses = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin' ? {}
    : req.user.role === 'teacher' ? { teacher: req.user._id }
    : { students: req.user._id };

  const courses = await Course.find(filter).populate('teacher', 'name email').sort({ createdAt: -1 });
  res.json(courses.map((c) => formatCourse(req.user, c)));
});

export const createCourse = asyncHandler(async (req, res) => {
  const { title, code, semester, teacherId } = req.body;
  if (!title || !code) return res.status(400).json({ message: 'Title and code are required' });

  let teacher = req.user._id;
  if (req.user.role === 'admin') {
    if (!teacherId) return res.status(400).json({ message: 'Admin must assign a teacher to the course' });
    const t = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!t) return res.status(400).json({ message: 'Selected teacher does not exist' });
    teacher = t._id;
  }

  const course = await Course.create({ title, code, semester, teacher });
  res.status(201).json(formatCourse(req.user, course));
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  // Check access before populating, because the access check compares raw ids.
  if (!isMemberOf(req.user, course)) return res.status(403).json({ message: 'You are not a member of this course' });

  await course.populate('teacher', 'name email');
  if (isStaffOf(req.user, course)) await course.populate('students', 'name email rollNo');
  res.json(formatCourse(req.user, course));
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot edit this course' });

  const { title, code, semester, teacherId } = req.body;
  if (title !== undefined) course.title = title;
  if (code !== undefined) course.code = code;
  if (semester !== undefined) course.semester = semester;

  // Only admins can reassign a course to a different teacher.
  if (teacherId !== undefined && req.user.role === 'admin') {
    const t = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!t) return res.status(400).json({ message: 'Selected teacher does not exist' });
    course.teacher = t._id;
  }

  await course.save();
  res.json(course);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot delete this course' });

  const assignments = await Assignment.find({ course: course._id });
  const submissions = await Submission.find({ assignment: { $in: assignments.map((a) => a._id) } });

  await Promise.all([
    ...submissions.map((s) => removeFiles(s.files)),
    ...assignments.map((a) => removeFiles(a.attachments)),
  ]);
  await Submission.deleteMany({ _id: { $in: submissions.map((s) => s._id) } });
  await Assignment.deleteMany({ course: course._id });
  await course.deleteOne();

  res.json({ message: 'Course deleted' });
});

export const joinCourse = asyncHandler(async (req, res) => {
  const code = String(req.body.joinCode || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ message: 'Join code is required' });

  const course = await Course.findOne({ joinCode: code });
  if (!course) return res.status(404).json({ message: 'No course found with this join code' });
  if (isEnrolled(req.user, course)) return res.status(400).json({ message: 'You are already enrolled in this course' });

  course.students.push(req.user._id);
  await course.save();
  res.json({ message: 'Joined course', courseId: course._id });
});

export const addStudent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot manage this course' });

  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Student email is required' });

  const student = await User.findOne({ email, role: 'student' });
  if (!student) {
    return res.status(404).json({ message: 'No student account found with this email. Ask the student to register first.' });
  }
  if (course.students.some((id) => String(id) === String(student._id))) {
    return res.status(400).json({ message: 'Student is already in this course' });
  }

  course.students.push(student._id);
  await course.save();
  res.status(201).json({ _id: student._id, name: student.name, email: student.email, rollNo: student.rollNo });
});

export const removeStudent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot manage this course' });

  course.students.pull(req.params.studentId);
  await course.save();
  res.json({ message: 'Student removed from course' });
});
