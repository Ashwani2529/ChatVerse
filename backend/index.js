const http = require('http');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 4501;
const socketIO = require('socket.io');
const axios = require('axios');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Better user management using Map
const connectedUsers = new Map();

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: 'running',
    port: port,
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
});

const server = http.createServer(app);

// Enhanced Socket.IO configuration with CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Input validation helper
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message must be a non-empty string' };
  }
  
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmedMessage.length > 500) {
    return { isValid: false, error: 'Message too long (max 500 characters)' };
  }
  
  return { isValid: true, message: trimmedMessage };
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username must be a non-empty string' };
  }
  
  const trimmedUsername = username.trim();
  if (trimmedUsername.length === 0) {
    return { isValid: false, error: 'Username cannot be empty' };
  }
  
  if (trimmedUsername.length > 50) {
    return { isValid: false, error: 'Username too long (max 50 characters)' };
  }
  
  // Basic sanitization - remove potentially harmful characters
  const sanitizedUsername = trimmedUsername.replace(/[<>]/g, '');
  return { isValid: true, username: sanitizedUsername };
};

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  socket.on('joined', ({ user }) => {
    try {
      const validation = validateUsername(user);
      
      if (!validation.isValid) {
        socket.emit('error', { message: validation.error });
        return;
      }
      
      const sanitizedUser = validation.username;
      connectedUsers.set(socket.id, sanitizedUser);
      
      // Broadcast to all other users
      socket.broadcast.emit('userJoined', { 
        user: "System", 
        message: `${sanitizedUser} joined the chat`,
        timestamp: new Date().toISOString()
      });
      
      // Send welcome message to the new user
      socket.emit('welcome', { 
        user: "System", 
        message: `Welcome to ChatVerse, ${sanitizedUser}!`,
        timestamp: new Date().toISOString()
      });
      
      console.log(`User ${sanitizedUser} joined with socket ID: ${socket.id}`);
    } catch (error) {
      console.error('Error in joined event:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  socket.on('message', async ({ message, id }) => {
    try {
      const user = connectedUsers.get(id);
      
      if (!user) {
        socket.emit('error', { message: 'User not found. Please rejoin the chat.' });
        return;
      }
      
      const validation = validateMessage(message);
      
      if (!validation.isValid) {
        socket.emit('error', { message: validation.error });
        return;
      }
      
      const sanitizedMessage = validation.message;
      
      // TODO: Implement toxicity detection when ready
      // const response = await axios.post('https://hate-speech-model-latest.onrender.com/predict', { text: sanitizedMessage });
      // const prediction = response.data.prediction;
      
      // if (prediction === "Toxic") {
      //     io.emit('sendMessage', {
      //         user: 'System',
      //         message: `Warning to ${user}: Please be respectful!`,
      //         id: 'system',
      //         timestamp: new Date().toISOString()
      //     });
      //     return;
      // }
      
      // Broadcast message to all connected clients
      io.emit('sendMessage', {
        user: user,
        message: sanitizedMessage,
        id: id,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Message from ${user}: ${sanitizedMessage}`);
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', (reason) => {
    try {
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        // Remove user from connected users
        connectedUsers.delete(socket.id);
        
        // Broadcast leave message to remaining users
        socket.broadcast.emit('leave', { 
          user: "System", 
          message: `${user} left the chat`,
          timestamp: new Date().toISOString()
        });
        
        console.log(`User ${user} disconnected: ${reason}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(port, () => {
  console.log(`🚀 ChatVerse server running on http://localhost:${port}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});
