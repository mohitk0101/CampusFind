require('dotenv').config();
const mongoose = require('mongoose');

// Register all models first
require('./backend/models/User');
require('./backend/models/Post');
const Message = require('./backend/models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusfind';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const messages = await Message.find({}).populate('sender').populate('receiver').populate('post');
    console.log(`Total messages found: ${messages.length}`);
    messages.forEach((msg, idx) => {
      console.log(`[${idx}] Post: "${msg.post?.itemName}" (${msg.post?._id})`);
      console.log(`    Sender: ${msg.sender?.name} (${msg.sender?._id})`);
      console.log(`    Receiver: ${msg.receiver?.name} (${msg.receiver?._id})`);
      console.log(`    Text: "${msg.text}"`);
    });
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });
