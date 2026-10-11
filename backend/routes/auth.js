import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';
import { protect } from '../middleware/auth.js';
import sendEmail from '../utils/sendEmail.js';

const ACCESS_COOKIE = 'cf_access';
const REFRESH_COOKIE = 'cf_refresh';
const ACCESS_TTL_SECONDS = 15 * 60;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAccessSecret() {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not configured');
  return process.env.JWT_ACCESS_SECRET;
}

function getRefreshSecret() {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
  return process.env.JWT_REFRESH_SECRET;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function cookieOptions(path, maxAge) {
  return {
    httpOnly: true,
    secure: isProduction(),
    // Vercel frontend + Render backend are cross-site in production.
    sameSite: isProduction() ? 'none' : 'lax',
    path,
    maxAge
  };
}

function setAuthCookies(res, accessToken, refreshToken, refreshMaxAge) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions('/', ACCESS_TTL_SECONDS * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions('/api/auth', refreshMaxAge));
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions('/', 0));
  res.clearCookie(REFRESH_COOKIE, cookieOptions('/api/auth', 0));
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createAccessToken(userId) {
  return jwt.sign({ id: String(userId), type: 'access' }, getAccessSecret(), {
    algorithm: 'HS256', expiresIn: ACCESS_TTL_SECONDS
  });
}

function createRefreshToken(userId, sessionId, expiresAt) {
  const remainingSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  if (remainingSeconds <= 0) throw new Error('Refresh session has expired');
  return jwt.sign({ id: String(userId), sid: String(sessionId), type: 'refresh' }, getRefreshSecret(), {
    algorithm: 'HS256', expiresIn: remainingSeconds
  });
}

function safeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.verificationToken;
  return obj;
}

async function issueLoginSession(user, res) {
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_TTL_MS); // fixed deadline; rotations do not extend this
  const session = await RefreshSession.create({
    userId: user._id,
    tokenHash: 'pending-' + crypto.randomBytes(24).toString('hex'),
    expiresAt
  });
  const refreshToken = createRefreshToken(user._id, session._id, expiresAt);
  session.tokenHash = hashToken(refreshToken);
  await session.save();
  const accessToken = createAccessToken(user._id);
  setAuthCookies(res, accessToken, refreshToken, Math.max(0, expiresAt.getTime() - now));
}

// @POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, rollNumber, email, password, confirmPassword } = req.body;
    if (!name || !rollNumber || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRoll = rollNumber.trim().toUpperCase();
    if (!normalizedEmail.endsWith('@nitkkr.ac.in')) {
      return res.status(400).json({ success: false, message: 'Only NIT Kurukshetra email addresses are allowed.' });
    }

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { rollNumber: normalizedRoll }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or roll number already registered.' });
    }

    const verificationToken = uuidv4();
    const bypassVerification = process.env.BYPASS_EMAIL_VERIFICATION === 'true';
    const user = await User.create({
      name: name.trim(),
      rollNumber: normalizedRoll,
      email: normalizedEmail,
      password,
      verificationToken: bypassVerification ? null : verificationToken,
      isVerified: bypassVerification
    });

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    if (!bypassVerification) {
      try {
        await sendEmail({
          email: normalizedEmail,
          name,
          subject: 'Verify your CampusFind Account',
          text: `Hello ${name}, click the link to verify your email: ${verifyUrl}`,
          verifyUrl
        });
      } catch (mailErr) {
        console.warn(`Verification email failed: ${mailErr.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: bypassVerification
        ? 'Registration successful! Verification bypassed (demo mode enabled).'
        : 'Registration successful! Please check your email to verify your account.',
      email: user.email
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or roll number already exists.' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// @GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    res.redirect(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/?verified=true` : '/?verified=true');
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ success: false, message: 'Email verification failed.' });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    await issueLoginSession(user, res);
    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// @POST /api/auth/refresh
// Access token is not required; the HttpOnly refresh cookie authenticates this request.
router.post('/refresh', async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  if (!oldToken) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Refresh session missing. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(oldToken, getRefreshSecret(), { algorithms: ['HS256'] });
    if (decoded.type !== 'refresh' || !decoded.id || !decoded.sid) throw new Error('Invalid refresh token');

    const now = new Date();
    const session = await RefreshSession.findOne({ _id: decoded.sid, userId: decoded.id });
    if (!session || session.revokedAt || session.expiresAt <= now) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh session expired. Please log in again.' });
    }

    const oldHash = hashToken(oldToken);
    if (session.tokenHash !== oldHash) {
      // A previously rotated token was presented again: revoke this session.
      await RefreshSession.updateOne({ _id: session._id, revokedAt: null }, { $set: { revokedAt: now } });
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh token reuse detected. Please log in again.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      await RefreshSession.updateOne({ _id: session._id }, { $set: { revokedAt: now } });
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // Rotation keeps the ORIGINAL session expiry fixed.
    const newRefreshToken = createRefreshToken(user._id, session._id, session.expiresAt);
    const newHash = hashToken(newRefreshToken);
    // Compare-and-swap prevents two simultaneous refreshes from both succeeding.
    const updated = await RefreshSession.findOneAndUpdate(
      { _id: session._id, tokenHash: oldHash, revokedAt: null, expiresAt: { $gt: now } },
      { $set: { tokenHash: newHash } },
      { new: true }
    );
    if (!updated) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh token is no longer valid. Please log in again.' });
    }

    const accessToken = createAccessToken(user._id);
    setAuthCookies(res, accessToken, newRefreshToken, Math.max(0, session.expiresAt.getTime() - Date.now()));
    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Refresh token is invalid or expired. Please log in again.' });
  }
});

// @POST /api/auth/logout — revokes only the current browser session.
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      try {
        const decoded = jwt.verify(token, getRefreshSecret(), { algorithms: ['HS256'], ignoreExpiration: true });
        if (decoded.sid) {
          await RefreshSession.updateOne(
            { _id: decoded.sid, userId: decoded.id, revokedAt: null },
            { $set: { revokedAt: new Date() } }
          );
        }
      } catch (_) {
        // Always clear cookies even if the browser sent a malformed/expired token.
      }
    }
    clearAuthCookies(res);
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    clearAuthCookies(res);
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  return res.json({ success: true, user: safeUser(req.user) });
});

// @PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, department, year, profilePicture, interestedCategories } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (department !== undefined) updates.department = department;
    if (year) updates.year = year;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (interestedCategories !== undefined) updates.interestedCategories = interestedCategories;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true, select: '-password -verificationToken'
    });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    await RefreshSession.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearAuthCookies(res);
    return res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Password change failed.' });
  }
});

export default router;
