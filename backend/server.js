require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

const app = express();

// Middleware
// Gzip/Brotli response compression - cuts JSON transfer size by ~70% on mobile networks
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

// Serve static assets if the folder exists (for unified deploy or local testing)
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Root route fallback for API-only deploy
app.get('/', (req, res) => {
  res.json({ success: true, message: 'CampusFind API is running successfully.' });
});

// Serve frontend for all other non-API routes if it exists
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, message: 'Route not found. This is an API-only server deployment.' });
    }
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusfind';

const checkAndArchivePosts = require('./utils/archiveScheduler');

// Initialize Cloudinary on startup (logs whether configured or fallback mode)
require('./utils/cloudinary');

mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,              // Up to 10 simultaneous socket connections
  minPoolSize: 2,               // Keep 2 connections warm to avoid cold-start latency
  serverSelectionTimeoutMS: 5000 // Fail fast instead of hanging for 30s
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Run archiving check on server startup
    checkAndArchivePosts();
    
    // Run archiving checker every 12 hours
    setInterval(checkAndArchivePosts, 12 * 60 * 60 * 1000);

    // Run status migration to active/resolved
    const migrateStatuses = async () => {
      try {
        const Post = require('./models/Post');
        const resApproved = await Post.updateMany({ status: 'approved' }, { status: 'active' });
        const resRecovered = await Post.updateMany({ status: 'recovered' }, { status: 'resolved', resolvedAt: new Date() });
        const resReturned = await Post.updateMany({ status: 'returned' }, { status: 'resolved', resolvedAt: new Date() });
        if (resApproved.modifiedCount > 0 || resRecovered.modifiedCount > 0 || resReturned.modifiedCount > 0) {
          console.log(`🧹 Migrated database statuses: Active: ${resApproved.modifiedCount}, Resolved: ${resRecovered.modifiedCount + resReturned.modifiedCount}`);
        }
      } catch (err) {
        console.error('Migration failed:', err.message);
      }
    };
    migrateStatuses();

    app.listen(PORT, () => {
      console.log(`🚀 CampusFind server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
