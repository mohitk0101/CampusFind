const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['new_post', 'post_approved', 'post_rejected', 'new_message', 'post_archived', 'post_resolved'],
    default: 'new_post'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index for fast user notification bell lookup (unread first)
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
