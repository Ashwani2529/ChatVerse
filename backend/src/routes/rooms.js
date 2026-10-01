const express = require('express');
const mongoose = require('mongoose');

const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');
const { serializeMessage } = require('../utils/serialize');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// A token is scoped to exactly one room, so reading any other room is a 403.
const requireOwnRoom = (req, res, next) => {
  const requested = String(req.params.roomId || '').toLowerCase();

  if (requested !== req.auth.roomId) {
    return res.status(403).json({ error: 'You are not a member of this room' });
  }

  return next();
};

/**
 * GET /api/rooms/:roomId/messages?before=<messageId>&limit=50
 * Returns a page of history oldest-first. Omit `before` for the newest page;
 * pass the oldest id you already hold to walk further back.
 */
router.get('/:roomId/messages', requireAuth, requireOwnRoom, asyncHandler(async (req, res) => {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const { before } = req.query;

  const query = { roomId: req.auth.roomId };

  if (before) {
    if (!mongoose.isValidObjectId(before)) {
      return res.status(400).json({ error: 'Invalid `before` cursor' });
    }

    const cursorDoc = await Message.findById(before).select('createdAt').lean();

    if (!cursorDoc) {
      return res.status(400).json({ error: 'Unknown `before` cursor' });
    }

    // Tie-break on _id so messages sharing a millisecond are never skipped.
    query.$or = [
      { createdAt: { $lt: cursorDoc.createdAt } },
      { createdAt: cursorDoc.createdAt, _id: { $lt: cursorDoc._id } },
    ];
  }

  // Fetch one extra row to tell whether an older page exists.
  const page = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = page.length > limit;
  const slice = hasMore ? page.slice(0, limit) : page;
  const messages = slice.reverse().map(serializeMessage);

  res.json({
    messages,
    hasMore,
    // Feed this back as `before` to load the next older page.
    nextCursor: messages.length ? messages[0]._id : null,
  });
}));

/** GET /api/rooms/:roomId — room metadata plus a total message count. */
router.get('/:roomId', requireAuth, requireOwnRoom, asyncHandler(async (req, res) => {
  const messageCount = await Message.countDocuments({ roomId: req.auth.roomId });

  res.json({
    room: {
      roomId: req.room.roomId,
      displayName: req.room.displayName,
      createdBy: req.room.createdBy,
      createdAt: req.room.createdAt,
      lastActivityAt: req.room.lastActivityAt,
    },
    messageCount,
  });
}));

module.exports = router;
