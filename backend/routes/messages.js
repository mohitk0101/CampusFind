const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Post = require('../models/Post');
const { protect, verifiedOnly } = require('../middleware/auth');

// @GET /api/messages/conversations - Get all conversations for current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // Get unique conversations (grouped by post + other party)
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('post', 'itemName type category images coverImageIndex status')
      .populate('sender', 'name profilePicture rollNumber')
      .populate('receiver', 'name profilePicture rollNumber')
      .sort({ updatedAt: -1 });

    // Group by post and other user
    const convMap = new Map();
    messages.forEach(msg => {
      if (!msg.post || !msg.sender || !msg.receiver) {
        return; // skip messages with deleted posts or users to prevent TypeError
      }
      const otherId = msg.sender._id.toString() === userId.toString() ? msg.receiver._id.toString() : msg.sender._id.toString();
      const key = `${msg.post._id}-${otherId}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          post: msg.post,
          otherUser: msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0
        });
      }
      if (!msg.isRead && msg.receiver._id.toString() === userId.toString()) {
        convMap.get(key).unreadCount++;
      }
    });

    res.json({ success: true, conversations: Array.from(convMap.values()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/messages/:postId/:userId - Get messages between current user and another user for a post
router.get('/:postId/:userId', protect, async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      post: postId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'name profilePicture rollNumber')
      .populate('receiver', 'name profilePicture rollNumber')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { post: postId, sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/messages - Send a message
router.post('/', protect, verifiedOnly, async (req, res) => {
  try {
    const { postId, receiverId, text, image } = req.body;
    if (!postId || !receiverId || !text) {
      return res.status(400).json({ success: false, message: 'Post, receiver, and text are required.' });
    }
    // Allow messaging in any stage except resolved
    const post = await Post.findById(postId);
    if (!post || post.status === 'resolved') {
      return res.status(403).json({ success: false, message: 'Messaging is not allowed on resolved posts.' });
    }
    const message = await Message.create({
      post: postId,
      sender: req.user._id,
      receiver: receiverId,
      text,
      image: image || null
    });
    await message.populate('sender', 'name profilePicture rollNumber');
    await message.populate('receiver', 'name profilePicture rollNumber');
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/messages/:postId/:userId - Delete entire conversation
router.delete('/:postId/:userId', protect, async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const currentUserId = req.user._id;

    // Delete all messages between these two users for this post
    await Message.deleteMany({
      post: postId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
