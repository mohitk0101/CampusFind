const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campusfind_default_secret_key_12345', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// @POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, rollNumber, email, password, confirmPassword } = req.body;

    if (!name || !rollNumber || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (!email.toLowerCase().endsWith('@nitkkr.ac.in')) {
      return res.status(400).json({ success: false, message: 'Only NIT Kurukshetra email addresses are allowed.' });
    }
    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { rollNumber: rollNumber.toUpperCase() }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or roll number already registered.' });
    }

    const verificationToken = uuidv4();
    const isVerifiedBypassed = process.env.BYPASS_EMAIL_VERIFICATION === 'true';
    const user = await User.create({ 
      name, 
      rollNumber: rollNumber.toUpperCase(), 
      email: email.toLowerCase(), 
      password, 
      verificationToken: isVerifiedBypassed ? null : verificationToken,
      isVerified: isVerifiedBypassed ? true : false
    });

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;

    // Send real verification email via Nodemailer if not bypassed
    if (!isVerifiedBypassed) {
      try {
        await sendEmail({
          email: email.toLowerCase(),
          name,
          subject: 'Verify your CampusFind Account',
          text: `Hello ${name}, click the link to verify your email: ${verifyUrl}`,
          verifyUrl
        });
      } catch (mailErr) {
        console.warn(`⚠️ Real verification email failed to send: ${mailErr.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: isVerifiedBypassed 
        ? 'Registration successful! Verification bypassed (Demo mode enabled).' 
        : 'Registration successful! Please check your email to verify your account.',
      email: user.email
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or roll number already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    // Redirect to auth page with success flag
    res.redirect('/?verified=true');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }
    const token = generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
    if (interestedCategories) updates.interestedCategories = interestedCategories;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
