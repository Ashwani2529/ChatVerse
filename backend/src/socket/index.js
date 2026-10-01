const { Server } = require('socket.io');

const Room = require('../models/Room');
const Message = require('../models/Message');
const { verifyToken } = require('../utils/token');
const { validateMessage } = require('../utils/validate');
const { serializeMessage } = require('../utils/serialize');
const { notifyRoom } = require('../services/push');
const presence = require('./presence');

// Simple per-socket burst limit: 10 messages per 10 seconds.
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 10;

const isRateLimited = (socket) => {
  const now = Date.now();
  const stamps = (socket.data.sentAt || []).filter((t) => now - t < RATE_WINDOW_MS);

  if (stamps.length >= RATE_MAX) {
    socket.data.sentAt = stamps;
    return true;
  }

  stamps.push(now);
  socket.data.sentAt = stamps;
  return false;
};

const roomChannel = (roomId) => `room:${roomId}`;

const attachSocket = (server, corsOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // The 60-day token is the only way in; it also fixes which room the socket
  // can ever read from or write to.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer /, '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyToken(token);
      const room = await Room.findOne({ roomId: payload.roomId }).lean();

      if (!room) {
        return next(new Error('This room no longer exists'));
      }

      socket.data.roomId = room.roomId;
      socket.data.roomName = room.displayName;
      socket.data.name = payload.name;
      socket.data.memberId = payload.memberId;

      return next();
    } catch (error) {
      const expired = error.name === 'TokenExpiredError';
      return next(new Error(expired ? 'Session expired' : 'Invalid session'));
    }
  });

  io.on('connection', (socket) => {
    const { roomId, name, memberId } = socket.data;
    const channel = roomChannel(roomId);

    socket.join(channel);

    const { isFirstSocket } = presence.addSocket(roomId, memberId, name, socket.id);

    socket.emit('room:ready', {
      room: { roomId, displayName: socket.data.roomName },
      user: { name, memberId },
      online: presence.listRoom(roomId),
    });

    // Join/leave notices are live-only; they are deliberately not persisted so
    // reopening a room shows conversation, not a log of comings and goings.
    if (isFirstSocket) {
      socket.to(channel).emit('system', {
        text: `${name} joined the room`,
        at: new Date().toISOString(),
      });
    }

    io.to(channel).emit('presence', { online: presence.listRoom(roomId) });

    socket.on('message:send', async (payload, ack) => {
      try {
        const check = validateMessage(payload?.text);

        if (!check.isValid) {
          socket.emit('error:message', { error: check.error, clientId: payload?.clientId });
          if (typeof ack === 'function') ack({ ok: false, error: check.error });
          return;
        }

        if (isRateLimited(socket)) {
          const error = 'You are sending messages too quickly. Please slow down.';
          socket.emit('error:message', { error, clientId: payload?.clientId });
          if (typeof ack === 'function') ack({ ok: false, error });
          return;
        }

        const saved = await Message.create({
          roomId,
          memberId,
          user: name,
          text: check.value,
          kind: 'chat',
        });

        await Room.updateOne({ roomId }, { $set: { lastActivityAt: new Date() } });

        const message = serializeMessage(saved);

        // clientId lets the sender swap its optimistic bubble for the saved one.
        io.to(channel).emit('message:new', { ...message, clientId: payload?.clientId });
        if (typeof ack === 'function') ack({ ok: true, message });

        // Push only reaches members with no live socket. Anyone still connected
        // gets notified by their own page, which knows whether they are looking
        // at the room — so push never duplicates an in-tab notification.
        notifyRoom({
          message,
          roomDisplayName: socket.data.roomName,
          skipMemberIds: presence.connectedMemberIds(roomId),
        }).catch((error) => console.error('Push dispatch failed:', error));
      } catch (error) {
        console.error('Failed to save message:', error);
        const message = 'Failed to send message. Please try again.';
        socket.emit('error:message', { error: message, clientId: payload?.clientId });
        if (typeof ack === 'function') ack({ ok: false, error: message });
      }
    });

    socket.on('typing', ({ isTyping } = {}) => {
      socket.to(channel).emit('typing', { memberId, name, isTyping: Boolean(isTyping) });
    });

    socket.on('disconnect', (reason) => {
      const { isLastSocket } = presence.removeSocket(roomId, memberId, socket.id);

      if (isLastSocket) {
        socket.to(channel).emit('system', {
          text: `${name} left the room`,
          at: new Date().toISOString(),
        });
        socket.to(channel).emit('typing', { memberId, name, isTyping: false });
      }

      io.to(channel).emit('presence', { online: presence.listRoom(roomId) });
      console.log(`${name} disconnected from ${roomId} (${reason})`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    console.log(`${name} connected to ${roomId} (${socket.id})`);
  });

  return io;
};

module.exports = { attachSocket, presence };
