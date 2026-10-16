import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ROLES = ['admin', 'teacher', 'student'];

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ name: 1 });
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNo, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (role && !ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await User.create({ name, email, password, role: role || 'student', rollNo, department });
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, rollNo, department, role, isActive, password } = req.body;
  const isSelf = String(user._id) === String(req.user._id);

  if (isSelf && (isActive === false || (role && role !== 'admin'))) {
    return res.status(400).json({ message: 'You cannot deactivate or demote your own admin account' });
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    user.role = role;
  }

  if (name !== undefined) user.name = name;
  if (rollNo !== undefined) user.rollNo = rollNo;
  if (department !== undefined) user.department = department;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  // Setting a new password here triggers the hashing hook in the User model.
  if (password) user.password = password;

  await user.save();
  res.json(user);
});

export const getStats = asyncHandler(async (req, res) => {
  const [students, teachers, admins, courses, assignments, submissions, graded] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    Course.countDocuments(),
    Assignment.countDocuments(),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'graded' }),
  ]);
  res.json({ students, teachers, admins, courses, assignments, submissions, graded });
});
