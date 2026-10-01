const path = require('path');

// Resolved against this file, not the shell's cwd, so `node backend/index.js`
// from the repo root loads the same config as `npm start` inside backend/.
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/rooms');
const { attachSocket, presence } = require('./src/socket');
const { TOKEN_DAYS } = require('./src/utils/token');

const port = process.env.PORT || 4501;

// FRONTEND_URL accepts a comma-separated list; localhost is always allowed so
// local development works against a deployed config unchanged.
const corsOrigins = [
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  'http://localhost:3000',
  'https://localhost:3000',
];

const app = express();

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);
app.use(express.json({ limit: '64kb' }));
app.set('trust proxy', 1);

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'ChatVerse',
    port,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    liveConnections: presence.totalConnections(),
    tokenLifetimeDays: TOKEN_DAYS,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('Unhandled request error:', error);
  res.status(500).json({ error: 'Something went wrong on our side' });
});

const server = http.createServer(app);
attachSocket(server, corsOrigins);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Could not start: ', error.message);
    process.exit(1);
  }

  server.listen(port, () => {
    console.log(`🚀 ChatVerse server running on http://localhost:${port}`);
    console.log(`🔐 Sessions last ${TOKEN_DAYS} days`);
    console.log(`🌐 Allowed origins: ${corsOrigins.join(', ')}`);
  });
};

const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close();
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
