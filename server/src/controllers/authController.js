import User from '../models/User.js';
import { setTokenCookie, TOKEN_COOKIE } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Students can register themselves. Teachers and admins are created by an admin.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await User.create({ name, email, password, rollNo, department, role: 'student' });
  setTokenCookie(res, user);
  res.status(201).json(user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated' });

  setTokenCookie(res, user);
  res.json(user);
});

export const me = (req, res) => res.json(req.user);

export const logout = (req, res) => {
  res.clearCookie(TOKEN_COOKIE);
  res.json({ message: 'Logged out' });
};
