const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

const REJECTION_REASONS = ['Spam', 'Duplicate', 'Fake', 'Wrong Category', 'Not Campus Related', 'Inappropriate Content', 'Other'];

// @GET /api/admin/pending - Get all pending posts
router.get('/pending', protect, adminOnly, async (req, res) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .populate('reporter', 'name rollNumber email department year')
      .sort({ createdAt: 1 });
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/posts/:id/approve - Approve a post
router.put('/posts/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('reporter', 'name interestedCategories');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    post.status = 'active';
    post.rejectionReason = null;
    await post.save();

    // Notify reporter
    await Notification.create({
      user: post.reporter._id,
      post: post._id,
      message: `Your ${post.type} post for "${post.itemName}" has been approved!`,
      type: 'post_approved'
    });

    // Notify students with matching interested categories
    const interestedUsers = await User.find({
      interestedCategories: post.category,
      isVerified: true,
      _id: { $ne: post.reporter._id }
    }).select('_id');

    const notifications = interestedUsers.map(u => ({
      user: u._id,
      post: post._id,
      message: `New ${post.type === 'lost' ? '🔴 Lost' : '🟢 Found'}: "${post.itemName}" in category ${post.category}`,
      type: 'new_post'
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, post, message: 'Post approved and notifications sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/posts/:id/reject - Reject a post
router.put('/posts/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    post.status = 'rejected';
    post.rejectionReason = reason;
    await post.save();

    // Notify reporter of rejection
    await Notification.create({
      user: post.reporter,
      post: post._id,
      message: `Your ${post.type} post for "${post.itemName}" was rejected. Reason: ${reason}`,
      type: 'post_rejected'
    });

    res.json({ success: true, post, message: 'Post rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/admin/posts/:id - Admin delete any post
router.delete('/posts/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, message: 'Post deleted by admin.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/stats - Platform statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const verifiedStatuses = ['active', 'resolved', 'archived'];
    const totalStudents = await User.countDocuments({ role: 'student', isVerified: true });
    const totalLost = await Post.countDocuments({ type: 'lost', status: { $in: verifiedStatuses } });
    const totalFound = await Post.countDocuments({ type: 'found', status: { $in: verifiedStatuses } });
    const totalResolved = await Post.countDocuments({ status: 'resolved' });
    const totalPending = await Post.countDocuments({ status: 'pending' });
    const totalActive = await Post.countDocuments({ status: 'active' });
    const totalArchived = await Post.countDocuments({ status: 'archived' });
    const totalRejected = await Post.countDocuments({ status: 'rejected' });

    // Recovery rate: resolved lost items / total lost items
    const totalResolvedLost = await Post.countDocuments({ status: 'resolved', type: 'lost' });
    const recoveryRate = totalLost > 0 ? Math.round((totalResolvedLost / totalLost) * 100) : 0;

    // Average recovery time (in days)
    const resolvedPosts = await Post.find({ status: 'resolved', resolvedAt: { $ne: null } });
    let totalRecoveryTimeMs = 0;
    let resolvedCount = 0;
    resolvedPosts.forEach(p => {
      if (p.resolvedAt && p.createdAt) {
        totalRecoveryTimeMs += (p.resolvedAt.getTime() - p.createdAt.getTime());
        resolvedCount++;
      }
    });
    const avgRecoveryTime = resolvedCount > 0 
      ? parseFloat((totalRecoveryTimeMs / (1000 * 60 * 60 * 24) / resolvedCount).toFixed(1))
      : 0;

    // Most lost category
    const categoryAgg = await Post.aggregate([
      { $match: { type: 'lost', status: { $in: verifiedStatuses } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Most lost location
    const locationAgg = await Post.aggregate([
      { $match: { type: 'lost', status: { $in: verifiedStatuses } } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent posts
    const recentPosts = await Post.find()
      .populate('reporter', 'name rollNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalStudents, totalLost, totalFound, totalResolved,
        totalPending, totalActive, totalArchived, totalRejected, recoveryRate,
        avgRecoveryTime,
        topCategories: categoryAgg,
        topLocations: locationAgg,
        recentPosts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/users - Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).sort({ dateJoined: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/rejection-reasons - Get rejection reasons list
router.get('/rejection-reasons', protect, adminOnly, (req, res) => {
  res.json({ success: true, reasons: REJECTION_REASONS });
});

module.exports = router;
