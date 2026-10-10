require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const compression = require('compression');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1); // Render runs behind a proxy; safe for HTTPS deployments.

const allowedOrigins = new Set(
  (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

app.use(compression());
app.use(cors({
  origin(origin, callback) {
    // No-Origin requests can be non-browser health checks/scripts; browser origins are allowlisted.
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error('Origin is not allowed by CampusFind CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(require('./middleware/csrfProtection'));

const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) app.use(express.static(frontendDistPath));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'CampusFind API is running successfully.' });
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    return res.status(404).json({ success: false, message: 'Route not found. This is an API-only server deployment.' });
  }
  return res.status(404).json({ success: false, message: 'API route not found.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  if (res.headersSent) return next(err);
  return res.status(500).json({ success: false, message: 'Server error.' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusfind';
const checkAndArchivePosts = require('./utils/archiveScheduler');
require('./utils/cloudinary');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    if (typeof checkAndArchivePosts === 'function') checkAndArchivePosts();

    const migrateStatuses = async () => {
      try {
        const Post = require('./models/Post');
        const resApproved = await Post.updateMany({ status: 'approved' }, { status: 'active' });
        const resRecovered = await Post.updateMany({ status: 'recovered' }, { status: 'resolved', resolvedAt: new Date() });
        const resReturned = await Post.updateMany({ status: 'returned' }, { status: 'resolved', resolvedAt: new Date() });
        if (resApproved.modifiedCount || resRecovered.modifiedCount || resReturned.modifiedCount) {
          console.log(`Migrated post statuses: active ${resApproved.modifiedCount}, resolved ${resRecovered.modifiedCount + resReturned.modifiedCount}`);
        }
      } catch (err) {
        console.error('Status migration failed:', err.message);
      }
    };
    migrateStatuses();

    app.listen(PORT, () => console.log(`CampusFind server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
