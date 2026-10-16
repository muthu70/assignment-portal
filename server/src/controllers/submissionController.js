import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isStaffOf, isEnrolled } from '../utils/access.js';
import { toFileMeta } from '../middleware/upload.js';
import { removeFiles } from '../utils/files.js';
import { studentView } from '../utils/submissions.js';

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isEnrolled(req.user, course)) return res.status(403).json({ message: 'You are not enrolled in this course' });

  const now = new Date();
  const isLate = now > assignment.dueDate;
  if (isLate && !assignment.allowLate) {
    return res.status(400).json({ message: 'The deadline has passed and late submissions are not accepted' });
  }

  const text = String(req.body.text || '').trim();
  const newFiles = (req.files || []).map(toFileMeta);
  if (!text && newFiles.length === 0) {
    return res.status(400).json({ message: 'Add some text or attach at least one file' });
  }

  let submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });

  if (submission) {
    if (!assignment.allowResubmit) {
      return res.status(400).json({ message: 'You have already submitted and resubmission is not allowed' });
    }
    submission.text = text;
    if (newFiles.length) {
      await removeFiles(submission.files);
      submission.files = newFiles;
    }
    // A resubmission clears the old grade so the teacher grades the new work.
    submission.attempts += 1;
    submission.submittedAt = now;
    submission.isLate = isLate;
    submission.status = 'submitted';
    submission.marks = null;
    submission.feedback = '';
    submission.released = false;
    submission.gradedBy = undefined;
    submission.gradedAt = undefined;
  } else {
    submission = new Submission({
      assignment: assignment._id,
      student: req.user._id,
      text,
      files: newFiles,
      submittedAt: now,
      isLate,
    });
  }

  await submission.save();
  res.status(201).json(studentView(submission));
});

export const listSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot view these submissions' });

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate('student', 'name email rollNo')
    .sort({ submittedAt: -1 });
  res.json(submissions);
});

export const getMySubmission = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isEnrolled(req.user, course)) return res.status(403).json({ message: 'You are not enrolled in this course' });

  const submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  res.json(submission ? studentView(submission) : null);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const assignment = await Assignment.findById(submission.assignment);
  const course = assignment && (await Course.findById(assignment.course));
  if (!course || !isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot grade this submission' });

  const { marks, feedback, release } = req.body;

  if (marks !== undefined && marks !== null && marks !== '') {
    const value = Number(marks);
    if (Number.isNaN(value) || value < 0 || value > assignment.maxMarks) {
      return res.status(400).json({ message: `Marks must be between 0 and ${assignment.maxMarks}` });
    }
    submission.marks = value;
    submission.status = 'graded';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
  }

  if (feedback !== undefined) submission.feedback = String(feedback);

  if (release !== undefined) {
    const shouldRelease = release === true || release === 'true';
    if (shouldRelease && submission.marks === null) {
      return res.status(400).json({ message: 'Save marks before releasing the grade' });
    }
    submission.released = shouldRelease;
  }

  await submission.save();
  res.json(submission);
});

export const releaseGrades = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const course = await Course.findById(assignment.course);
  if (!course || !isStaffOf(req.user, course)) return res.status(403).json({ message: 'You cannot release grades here' });

  const result = await Submission.updateMany(
    { assignment: assignment._id, status: 'graded' },
    { released: true }
  );
  res.json({ released: result.modifiedCount });
});
