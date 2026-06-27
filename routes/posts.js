const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, verifiedOnly } = require('../middleware/auth');

// @GET /api/posts - Get all approved posts with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, category, type, location, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (type && ['lost', 'found'].includes(type)) query.type = type;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('reporter', 'name rollNumber department year profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, posts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/posts/dashboard-stats - Get public counts for dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    const verifiedStatuses = ['active', 'resolved', 'archived'];
    const totalLost = await Post.countDocuments({ type: 'lost', status: { $in: verifiedStatuses } });
    const totalFound = await Post.countDocuments({ type: 'found', status: { $in: verifiedStatuses } });
    const totalPosts = totalLost + totalFound;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lostThisWeek = await Post.countDocuments({ type: 'lost', status: { $in: verifiedStatuses }, createdAt: { $gte: oneWeekAgo } });
    const foundThisWeek = await Post.countDocuments({ type: 'found', status: { $in: verifiedStatuses }, createdAt: { $gte: oneWeekAgo } });
    const totalThisWeek = lostThisWeek + foundThisWeek;

    res.json({
      success: true,
      stats: {
        totalLost,
        totalFound,
        totalPosts,
        lostThisWeek,
        foundThisWeek,
        totalThisWeek
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/posts/my - Get current user's posts
router.get('/my', protect, async (req, res) => {
  try {
    const posts = await Post.find({
      $or: [
        { reporter: req.user._id },
        { finder: req.user._id },
        { owner: req.user._id }
      ]
    })
    .populate('reporter', 'name rollNumber')
    .populate('finder', 'name rollNumber')
    .populate('owner', 'name rollNumber')
    .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('reporter', 'name rollNumber department year profilePicture dateJoined')
      .populate('finder', 'name rollNumber')
      .populate('owner', 'name rollNumber');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/posts - Create new post
router.post('/', protect, verifiedOnly, async (req, res) => {
  try {
    const { itemName, type, category, description, location, date, images, imageTypes, coverImageIndex, questions } = req.body;

    if (!images || images.length < 1 || images.length > 5) {
      return res.status(400).json({ success: false, message: 'Upload between 1 and 5 images.' });
    }
    if (type === 'found' && imageTypes && imageTypes.some(t => t === 'reference')) {
      return res.status(400).json({ success: false, message: 'Found posts can only have actual photos, not reference images.' });
    }

    const post = await Post.create({
      itemName, type, category, description, location, date,
      images, imageTypes: imageTypes || [], coverImageIndex: coverImageIndex || 0,
      reporter: req.user._id, questions
    });

    res.status(201).json({ success: true, post, message: 'Post submitted for admin approval.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/posts/:id - Update post (only owner, only pending posts)
router.put('/:id', protect, verifiedOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post.' });
    }
    if (!['pending', 'rejected'].includes(post.status)) {
      return res.status(400).json({ success: false, message: 'Only pending or rejected posts can be edited.' });
    }

    const allowed = ['itemName', 'category', 'description', 'location', 'date', 'images', 'imageTypes', 'coverImageIndex', 'questions'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });
    post.status = 'pending'; // Reset to pending on edit
    post.rejectionReason = null;
    await post.save();

    res.json({ success: true, post, message: 'Post updated and resubmitted for approval.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/posts/:id - Delete post (only owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/posts/:id/confirm-handover - Confirm handover by the finder
router.put('/:id/confirm-handover', protect, verifiedOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.status !== 'active') return res.status(400).json({ success: false, message: 'Post is not active.' });

    const { counterpartyId } = req.body;

    // Determine who the finder is
    if (post.type === 'found') {
      // Reporter of found item is the finder
      if (post.reporter.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the finder (reporter) can confirm handover of a found item.' });
      }
      if (counterpartyId) post.owner = counterpartyId;
    } else {
      // Lost item: counterparty is the finder
      if (post.reporter.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'As the owner, you must confirm receipt, not handover.' });
      }
      post.finder = req.user._id;
      post.owner = post.reporter;
    }

    post.finderConfirmed = true;

    // Check if both confirmed
    if (post.ownerConfirmed && post.finderConfirmed) {
      post.status = 'resolved';
      post.resolvedAt = new Date();

      // Notify both users
      const usersToNotify = [post.owner, post.finder];
      for (const userId of usersToNotify) {
        if (userId) {
          await Notification.create({
            user: userId,
            post: post._id,
            message: `🎉 Item "${post.itemName}" has been successfully marked as Resolved!`,
            type: 'post_resolved'
          });
        }
      }
    } else {
      // Notify owner that finder confirmed handover
      const targetUser = post.type === 'found' ? post.owner : post.reporter;
      if (targetUser) {
        await Notification.create({
          user: targetUser,
          post: post._id,
          message: `🤝 The finder has confirmed handover of "${post.itemName}". Please confirm receipt to resolve.`,
          type: 'post_resolved'
        });
      }
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/posts/:id/confirm-receipt - Confirm receipt by the owner
router.put('/:id/confirm-receipt', protect, verifiedOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.status !== 'active') return res.status(400).json({ success: false, message: 'Post is not active.' });

    const { counterpartyId } = req.body;

    // Determine who the owner is
    if (post.type === 'lost') {
      // Reporter of lost item is the owner
      if (post.reporter.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the owner (reporter) can confirm receipt of a lost item.' });
      }
      if (counterpartyId) post.finder = counterpartyId;
    } else {
      // Found item: counterparty is the owner
      if (post.reporter.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'As the finder, you must confirm handover, not receipt.' });
      }
      post.owner = req.user._id;
      post.finder = post.reporter;
    }

    post.ownerConfirmed = true;

    // Check if both confirmed
    if (post.ownerConfirmed && post.finderConfirmed) {
      post.status = 'resolved';
      post.resolvedAt = new Date();

      // Notify both users
      const usersToNotify = [post.owner, post.finder];
      for (const userId of usersToNotify) {
        if (userId) {
          await Notification.create({
            user: userId,
            post: post._id,
            message: `🎉 Item "${post.itemName}" has been successfully marked as Resolved!`,
            type: 'post_resolved'
          });
        }
      }
    } else {
      // Notify finder that owner confirmed receipt
      const targetUser = post.type === 'lost' ? post.finder : post.reporter;
      if (targetUser) {
        await Notification.create({
          user: targetUser,
          post: post._id,
          message: `🤝 The owner has confirmed receipt of "${post.itemName}". Please confirm handover to resolve.`,
          type: 'post_resolved'
        });
      }
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
