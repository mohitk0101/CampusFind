const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@nitkkr\.ac\.in$/, 'Only NIT Kurukshetra email addresses (@nitkkr.ac.in) are allowed']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  department: {
    type: String,
    default: ''
  },
  year: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  profilePicture: {
    type: String,
    default: ''
  },
  interestedCategories: {
    type: [String],
    default: ['Wallet', 'ID Card', 'Electronics', 'Calculator', 'Laptop Charger', 'Books', 'Earbuds', 'Keys', 'Water Bottle', 'Bag', 'Watch', 'Clothes', 'Sports Equipment', 'Bicycle', 'Documents', 'Others']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  dateJoined: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
