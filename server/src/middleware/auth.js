import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const TOKEN_COOKIE = 'token';

export const setTokenCookie = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const authenticate = async (req, res, next) => {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) return res.status(401).json({ message: 'Please log in' });

  let user;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    user = await User.findById(id);
  } catch {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }

  if (!user || !user.isActive) return res.status(401).json({ message: 'Account unavailable' });
  req.user = user;
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission for this action' });
  }
  next();
};
