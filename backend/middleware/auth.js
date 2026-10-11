import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_COOKIE = 'cf_access';

function getAccessSecret() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return process.env.JWT_ACCESS_SECRET;
}

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, getAccessSecret(), { algorithms: ['HS256'] });
    if (decoded.type !== 'access' || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid access token.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Access token is invalid or expired.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

const verifiedOnly = (req, res, next) => {
  if (req.user?.isVerified) return next();
  return res.status(403).json({ success: false, message: 'Please verify your email first.' });
};

export { protect, adminOnly, verifiedOnly };
