const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const Room = require('../models/Room');
const { signToken, TOKEN_DAYS } = require('../utils/token');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  validateRoomId,
  validatePassword,
  validateName,
} = require('../utils/validate');

const router = express.Router();

// Keeps room passwords from being brute forced from a single address.
const joinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many join attempts. Please try again in a few minutes.' },
});

const buildSession = (room, name) => {
  const memberId = crypto.randomUUID();

  return {
    token: signToken({ roomId: room.roomId, name, memberId }),
    expiresInDays: TOKEN_DAYS,
    room: {
      roomId: room.roomId,
      displayName: room.displayName,
      createdAt: room.createdAt,
    },
    user: { name, memberId },
  };
};

/**
 * POST /api/auth/join
 * Enters a room with { roomId, password, name }. A room that does not exist yet
 * is created, and the password supplied becomes that room's password.
 */
router.post('/join', joinLimiter, asyncHandler(async (req, res) => {
  const { roomId, password, name } = req.body || {};

  const roomCheck = validateRoomId(roomId);
  if (!roomCheck.isValid) {
    return res.status(400).json({ error: roomCheck.error, field: 'roomId' });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ error: passwordCheck.error, field: 'password' });
  }

  const nameCheck = validateName(name);
  if (!nameCheck.isValid) {
    return res.status(400).json({ error: nameCheck.error, field: 'name' });
  }

  const normalizedRoomId = roomCheck.value.toLowerCase();

  let room = await Room.findOne({ roomId: normalizedRoomId });
  let created = false;

  if (!room) {
    try {
      room = await Room.create({
        roomId: normalizedRoomId,
        displayName: roomCheck.value,
        passwordHash: await Room.hashPassword(passwordCheck.value),
        createdBy: nameCheck.value,
      });
      created = true;
    } catch (error) {
      // Someone created the same room a moment earlier — fall through to the
      // normal password check against the room that won the race.
      if (error.code !== 11000) throw error;
      room = await Room.findOne({ roomId: normalizedRoomId });
      if (!room) throw error;
    }
  }

  if (!created) {
    const passwordMatches = await room.verifyPassword(passwordCheck.value);

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Incorrect password for this room',
        field: 'password',
      });
    }
  }

  return res.status(created ? 201 : 200).json({
    ...buildSession(room, nameCheck.value),
    created,
  });
}));

/**
 * GET /api/auth/me
 * Used on app start to restore a saved 60-day session without re-entering creds.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    room: {
      roomId: req.room.roomId,
      displayName: req.room.displayName,
      createdAt: req.room.createdAt,
    },
    user: { name: req.auth.name, memberId: req.auth.memberId },
    expiresAt: new Date(req.auth.exp * 1000).toISOString(),
  });
});

module.exports = router;
