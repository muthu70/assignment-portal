import path from 'path';
import fs from 'fs';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isMemberOf, isStaffOf } from '../utils/access.js';
import { UPLOAD_DIR } from '../middleware/upload.js';

// Files are only served after an access check, so they are never public URLs.
export const downloadFile = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  let meta;

  // Case 1: an assignment attachment. Any member of the course can download it.
  const assignment = await Assignment.findOne({ 'attachments.filename': filename });
  if (assignment) {
    const course = await Course.findById(assignment.course);
    if (!course || !isMemberOf(req.user, course)) return res.status(403).json({ message: 'Access denied' });
    meta = assignment.attachments.find((f) => f.filename === filename);
  } else {
    // Case 2: a student's submitted file. Only the student who submitted it or course staff can download it.
    const submission = await Submission.findOne({ 'files.filename': filename });
    if (!submission) return res.status(404).json({ message: 'File not found' });

    const subAssignment = await Assignment.findById(submission.assignment);
    const course = subAssignment && (await Course.findById(subAssignment.course));
    if (!course) return res.status(404).json({ message: 'File not found' });

    const isOwner = String(submission.student) === String(req.user._id);
    if (!isOwner && !isStaffOf(req.user, course)) return res.status(403).json({ message: 'Access denied' });
    meta = submission.files.find((f) => f.filename === filename);
  }

  if (!meta || !fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on server' });
  res.download(filePath, meta.originalName);
});
