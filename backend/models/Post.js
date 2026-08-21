const mongoose = require('mongoose');

const CATEGORIES = ['Wallet', 'ID Card', 'Electronics', 'Calculator', 'Laptop Charger', 'Books', 'Earbuds', 'Keys', 'Water Bottle', 'Bag', 'Watch', 'Clothes', 'Sports Equipment', 'Bicycle', 'Documents', 'Others'];

const postSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Post type (lost/found) is required']
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  images: {
    type: [String],
    validate: {
      validator: function(arr) { return arr.length >= 1 && arr.length <= 1; },
      message: 'You must upload exactly 1 image'
    }
  },
  imageTypes: {
    type: [String],
    default: []
  },
  coverImageIndex: {
    type: Number,
    default: 0
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'resolved', 'rejected', 'archived'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  finder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  finderConfirmed: {
    type: Boolean,
    default: false
  },
  ownerConfirmed: {
    type: Boolean,
    default: false
  },
  warnedAboutArchiving: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  },
  questions: {
    question1: { type: String, required: true },
    question2: { type: String, required: true },
    question3: { type: String, required: true }
  }
}, { timestamps: true });

// Text index for search
postSchema.index({
  itemName: 'text',
  description: 'text',
  location: 'text'
});

module.exports = mongoose.model('Post', postSchema);
module.exports.CATEGORIES = CATEGORIES;
