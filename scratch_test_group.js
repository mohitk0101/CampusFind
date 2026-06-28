require('dotenv').config();
const mongoose = require('mongoose');

require('./backend/models/User');
require('./backend/models/Post');
const Message = require('./backend/models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusfind';

mongoose.connect(MONGO_URI)
  .then(async () => {
    // Let's test Priya Verma's conversations (ID: 6a3fb46690d6efa491bb07b4)
    const userId = new mongoose.Types.ObjectId('6a3fb46690d6efa491bb07b4');
    try {
      const messages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
      })
        .populate('post')
        .populate('sender')
        .populate('receiver')
        .sort({ updatedAt: -1 });

      console.log(`Found ${messages.length} messages for Priya Verma`);

      const convMap = new Map();
      messages.forEach(msg => {
        // Safe check for populated objects
        if (!msg.sender || !msg.receiver || !msg.post) {
          console.log(`Warning: message ${msg._id} has null references: sender=${!!msg.sender}, receiver=${!!msg.receiver}, post=${!!msg.post}`);
          return;
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
      console.log(`Grouped into ${convMap.size} conversations`);
    } catch (e) {
      console.error('Error grouping conversations:', e);
    }
    mongoose.connection.close();
  });
