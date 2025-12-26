import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const initializeSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room for progress updates
    socket.join(`user-${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Handle video progress subscription
    socket.on('subscribe-video', (videoId) => {
      socket.join(`video-${videoId}`);
      console.log(`User ${socket.userId} subscribed to video ${videoId}`);
    });

    socket.on('unsubscribe-video', (videoId) => {
      socket.leave(`video-${videoId}`);
    });
  });
};

