import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isStaffOf, isMemberOf } from '../utils/access.js';
import { toFileMeta } from '../middleware/upload.js';
import { removeFiles } from '../utils/files.js';
import { summarizeForStudent } from '../utils/submissions.js';

// Form fields arrive as strings, so "true" / "false" / "on" all need handling.
const toBool = (value, fallback) =>
  value === undefined ? fallback : value === true || value === 'true' || value === 'on';

export const listAssignments = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!isMemberOf(req.user, course)) return res.status(403).json({ message: 'You are not a member of this course' });

  const assignments = await Assignment.find({ course: course._id }).sort({ dueDate: 1 }).lean();
  const ids = assignments.map((a) => a._id);

  if (req.user.role === 'student') {
    const subs = await Submission.find({ assignment: { $in: ids }, student: req.user._id }).lean();
    const byAssignment = new Map(subs.map((s) => [String(s.assignment), s]));
    return res.json(
      assignments.map((a) => {
        const s = byAssignment.get(String(a._id));
        return { ...a, mySubmission: s ? summarizeForStudent(s) : null };
      })
    );
  }

  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: ids } } },
    { $group: { _id: '$assignment', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(assignments.map((a) => ({ ...a, submissionCount: countMap.get(String(a._id)) || 0 })));
});

export const createAssignment = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot add assignments to this course' });

  const { title, description, dueDate, maxMarks, allowLate, allowResubmit } = req.body;
  if (!title || !dueDate) return res.status(400).json({ message: 'Title and due date are required' });

  const assignment = await Assignment.create({
    course: course._id,
    title,
    description: description || '',
    dueDate: new Date(dueDate),
    maxMarks: maxMarks ? Number(maxMarks) : 100,
    allowLate: toBool(allowLate, false),
    allowResubmit: toBool(allowResubmit, true),
    attachments: (req.files || []).map(toFileMeta),
    createdBy: req.user._id,
  });

  res.status(201).json(assignment);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isMemberOf(req.user, course)) return res.status(403).json({ message: 'You are not a member of this course' });

  res.json({
    ...assignment.toObject(),
    course: { _id: course._id, title: course.title, code: course.code },
    canManage: isStaffOf(req.user, course),
  });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot edit this assignment' });

  const { title, description, dueDate, maxMarks, allowLate, allowResubmit } = req.body;
  if (title !== undefined) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
  if (maxMarks !== undefined) assignment.maxMarks = Number(maxMarks);
  if (allowLate !== undefined) assignment.allowLate = toBool(allowLate, assignment.allowLate);
  if (allowResubmit !== undefined) assignment.allowResubmit = toBool(allowResubmit, assignment.allowResubmit);
  if (req.files?.length) assignment.attachments.push(...req.files.map(toFileMeta));

  await assignment.save();
  res.json(assignment);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot delete this assignment' });

  const submissions = await Submission.find({ assignment: assignment._id });
  await Promise.all([
    ...submissions.map((s) => removeFiles(s.files)),
    removeFiles(assignment.attachments),
  ]);
  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.json({ message: 'Assignment deleted' });
});
