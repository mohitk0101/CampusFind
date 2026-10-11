import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Post from '../models/Post.js';

let io;

export function conversationRoom(postId, userA, userB) {
  const ids = [String(userA), String(userB)].sort();
  return `conversation:${String(postId)}:${ids[0]}:${ids[1]}`;
}

export function getIO() {
  return io;
}

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

export function attachSocketServer(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
        return callback(new Error('Origin is not allowed by CampusFind CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = parseCookie(socket.handshake.headers.cookie, 'cf_access');
      if (!token || !process.env.JWT_ACCESS_SECRET) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
      if (decoded.type !== 'access' || !decoded.id) return next(new Error('Invalid access token'));
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Access token is invalid or expired'));
    }
  });

  io.on('connection', (socket) => {
    const currentUserId = String(socket.data.user._id);
    socket.join(`user:${currentUserId}`);

    socket.on('conversation:join', async (payload = {}, acknowledge = () => {}) => {
      try {
        const { postId, otherUserId } = payload;
        if (!postId || !otherUserId || !/^[a-f\d]{24}$/i.test(String(postId)) || !/^[a-f\d]{24}$/i.test(String(otherUserId))) {
          return acknowledge({ success: false, message: 'Invalid conversation details.' });
        }
        if (String(otherUserId) === currentUserId) {
          return acknowledge({ success: false, message: 'Cannot open a conversation with yourself.' });
        }
        const [post, otherUser] = await Promise.all([
          Post.findById(postId).select('reporter owner finder status'),
          User.findById(otherUserId).select('_id')
        ]);
        if (!post || post.status === 'resolved' || !otherUser) {
          return acknowledge({ success: false, message: 'Conversation is unavailable.' });
        }
        const postPeople = [post.reporter, post.owner, post.finder].filter(Boolean).map(String);
        // A new claimant may start a chat with the post reporter before a conversation exists.
        const participantPairAllowed =
          (postPeople.includes(currentUserId) && postPeople.includes(String(otherUserId))) ||
          String(post.reporter) === currentUserId ||
          String(post.reporter) === String(otherUserId);
        if (!participantPairAllowed) {
          return acknowledge({ success: false, message: 'You are not allowed to join this conversation.' });
        }
        socket.join(conversationRoom(postId, currentUserId, otherUserId));
        acknowledge({ success: true });
      } catch (error) {
        acknowledge({ success: false, message: 'Could not join conversation.' });
      }
    });

    socket.on('conversation:leave', (payload = {}) => {
      const { postId, otherUserId } = payload;
      if (postId && otherUserId) socket.leave(conversationRoom(postId, currentUserId, otherUserId));
    });
  });

  return io;
}
