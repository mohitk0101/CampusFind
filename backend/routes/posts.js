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
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Run all 6 queries in parallel to drastically improve loading speeds
    const [
      totalLost,
      totalFound,
      totalResolvedPosts,
      lostThisWeek,
      foundThisWeek,
      resolvedThisWeekPosts
    ] = await Promise.all([
      Post.countDocuments({ type: 'lost', status: { $in: verifiedStatuses } }),
      Post.countDocuments({ type: 'found', status: { $in: verifiedStatuses } }),
      Post.find({ status: 'resolved' }),
      Post.countDocuments({ type: 'lost', status: { $in: verifiedStatuses }, createdAt: { $gte: oneWeekAgo } }),
      Post.countDocuments({ type: 'found', status: { $in: verifiedStatuses }, createdAt: { $gte: oneWeekAgo } }),
      Post.find({ status: 'resolved', resolvedAt: { $gte: oneWeekAgo } })
    ]);

    const totalPosts = totalLost + totalFound;

    const uniqueResolvedKeys = new Set();
    let totalResolved = 0;
    totalResolvedPosts.forEach(post => {
      const repId = post.reporter ? post.reporter.toString() : '';
      const otherId = post.type === 'lost' 
        ? (post.finder ? post.finder.toString() : '')
        : (post.owner ? post.owner.toString() : '');
      if (repId && otherId) {
        const sortedUsers = [repId, otherId].sort().join('_');
        const key = `${sortedUsers}_${post.category}`;
        if (!uniqueResolvedKeys.has(key)) {
          uniqueResolvedKeys.add(key);
          totalResolved++;
        }
      } else {
        totalResolved++;
      }
    });

    const totalThisWeek = lostThisWeek + foundThisWeek;

    const uniqueResolvedThisWeekKeys = new Set();
    let resolvedThisWeek = 0;
    resolvedThisWeekPosts.forEach(post => {
      const repId = post.reporter ? post.reporter.toString() : '';
      const otherId = post.type === 'lost' 
        ? (post.finder ? post.finder.toString() : '')
        : (post.owner ? post.owner.toString() : '');
      if (repId && otherId) {
        const sortedUsers = [repId, otherId].sort().join('_');
        const key = `${sortedUsers}_${post.category}`;
        if (!uniqueResolvedThisWeekKeys.has(key)) {
          uniqueResolvedThisWeekKeys.add(key);
          resolvedThisWeek++;
        }
      } else {
        resolvedThisWeek++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalLost,
        totalFound,
        totalPosts,
        lostThisWeek,
        foundThisWeek,
        totalThisWeek,
        totalResolved,
        resolvedThisWeek
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/posts/my - Get current user's posts
router.get('/my', protect, async (req, res) => {
  try {
    const posts = await Post.find({ reporter: req.user._id })
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

    if (!images || images.length < 1 || images.length > 2) {
      return res.status(400).json({ success: false, message: 'Upload between 1 and 2 images.' });
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

    // Who can confirm handover?
    // - For found post: Only the reporter (finder)
    // - For lost post: Only the student who claimed it (post.finder)
    if (post.type === 'found') {
      if (post.reporter.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the finder (reporter) can confirm handover of a found item.' });
      }
    } else {
      if (!post.finder || post.finder.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the finder who claimed this item can confirm handover.' });
      }
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

    // Who can confirm receipt?
    // - For lost post: Only the reporter (owner)
    // - For found post: Only the student who claimed it (post.owner)
    if (post.type === 'lost') {
      if (post.reporter.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the owner (reporter) can confirm receipt of a lost item.' });
      }
    } else {
      if (!post.owner || post.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only the owner who claimed this item can confirm receipt.' });
      }
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

// @PUT /api/posts/:id/claim-lost - Claim finding a lost item
router.put('/:id/claim-lost', protect, verifiedOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.type !== 'lost') return res.status(400).json({ success: false, message: 'Only lost items can be claimed.' });
    if (post.status !== 'active') return res.status(400).json({ success: false, message: 'Post is not active.' });
    if (post.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot claim your own lost item.' });
    }
    if (post.finder) {
      return res.status(400).json({ success: false, message: 'This item has already been claimed.' });
    }

    post.finder = req.user._id;
    await post.save();

    // Notify owner
    await Notification.create({
      user: post.reporter,
      post: post._id,
      message: `📢 A student has claimed they found your lost item: "${post.itemName}". Please coordinate in Chat!`,
      type: 'post_resolved'
    });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/posts/:id/claim-found - Claim ownership of a found item
router.put('/:id/claim-found', protect, verifiedOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.type !== 'found') return res.status(400).json({ success: false, message: 'Only found items can be claimed.' });
    if (post.status !== 'active') return res.status(400).json({ success: false, message: 'Post is not active.' });
    if (post.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot claim your own found item.' });
    }
    if (post.owner) {
      return res.status(400).json({ success: false, message: 'This item has already been claimed.' });
    }

    post.owner = req.user._id;
    await post.save();

    // Notify finder
    await Notification.create({
      user: post.reporter,
      post: post._id,
      message: `📢 A student has claimed ownership of your found item: "${post.itemName}". Please coordinate in Chat!`,
      type: 'post_resolved'
    });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/posts/contact - Handle contact form submissions
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }

  try {
    const sendEmail = require('../utils/sendEmail');
    
    // Construct email content
    const emailSubject = `📩 CampusFind Contact Form: ${subject || 'General Inquiry'}`;
    const emailText = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #efefef; padding-bottom: 16px;">
          <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: -1px;">🔍 CampusFind Inbound</span>
          <div style="font-size: 11px; text-transform: uppercase; color: #999; margin-top: 4px; letter-spacing: 1px;">Contact Form Submission</div>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 700; color: #1e1f29; margin-bottom: 16px;">New Inquiry Received</h2>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>From Name:</strong> ${name}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>From Email:</strong> ${email}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Subject:</strong> ${subject || 'N/A'}</p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #374151;"><strong>Message:</strong></p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">
          ${message}
        </div>
        
        <hr style="border: 0; border-top: 1px solid #efefef; margin: 24px 0;">
        <p style="font-size: 11px; color: #aaaaaa; text-align: center; margin: 0;">
          This message was sent securely via the contact form on CampusFind NITKKR.
        </p>
      </div>
    `;

    // Send the email only to the support mailbox (so it works for all users in Resend sandbox mode)
    const sent = await sendEmail({
      email: 'mkmkbhojawas@gmail.com', 
      replyTo: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    if (sent === false) {
      return res.status(500).json({ 
        success: false, 
        message: 'Support email is not configured on the server. Please add RESEND_API_KEY (for Render) or EMAIL_USER/EMAIL_PASS (for localhost) to environment variables.' 
      });
    }

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact email sending failed:', err.message);
    res.status(500).json({ success: false, message: 'Could not send message. Please try again later.' });
  }
});

module.exports = router;
