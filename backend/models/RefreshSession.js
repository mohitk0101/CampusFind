const mongoose = require('mongoose');

const refreshSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // SHA-256 hash of the CURRENT refresh JWT. Never store the raw token.
  tokenHash: { type: String, required: true, unique: true },
  // Fixed deadline established at login; rotation must never extend it.
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('RefreshSession', refreshSessionSchema);
