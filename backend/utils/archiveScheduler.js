const Post = require('../models/Post');
const Notification = require('../models/Notification');

/**
 * Periodically runs to archive active posts that have been live for 30 days,
 * and sends warnings for active posts that have been live for 25 days.
 */
const checkAndArchivePosts = async () => {
  try {
    const now = new Date();

    // 1. Archive posts older than 30 days
    const archiveThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const postsToArchive = await Post.find({
      status: 'active',
      createdAt: { $lte: archiveThreshold }
    });

    for (const post of postsToArchive) {
      post.status = 'archived';
      post.archivedAt = now;
      await post.save();

      // Send notification to owner
      await Notification.create({
        user: post.reporter,
        post: post._id,
        message: `Your post for "${post.itemName}" has been automatically archived after 30 days.`,
        type: 'post_archived'
      });
      console.log(`📦 [SCHEDULER] Archived post "${post.itemName}" (${post._id})`);
    }

    // 2. Warn posts older than 25 days (and not warned yet)
    const warnThreshold = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
    const postsToWarn = await Post.find({
      status: 'active',
      warnedAboutArchiving: false,
      createdAt: { $lte: warnThreshold }
    });

    for (const post of postsToWarn) {
      post.warnedAboutArchiving = true;
      await post.save();

      // Send notification to owner
      await Notification.create({
        user: post.reporter,
        post: post._id,
        message: `Your post for "${post.itemName}" is active for 25 days and will be archived in 5 days.`,
        type: 'post_archived'
      });
      console.log(`⚠️ [SCHEDULER] Warning sent for post "${post.itemName}" (${post._id})`);
    }
  } catch (err) {
    console.error('❌ [SCHEDULER ERROR] Failed to run archiving check:', err.message);
  }
};

module.exports = checkAndArchivePosts;
