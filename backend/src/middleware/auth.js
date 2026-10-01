const { verifyToken } = require('../utils/token');
const Room = require('../models/Room');
const asyncHandler = require('../utils/asyncHandler');

const extractToken = (req) => {
  const header = req.headers.authorization || '';

  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return null;
};

// Verifies the 60-day token and confirms the room it points at still exists.
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'Session expired, please sign in again' : 'Invalid session',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }

  const room = await Room.findOne({ roomId: payload.roomId });

  if (!room) {
    return res.status(404).json({ error: 'This room no longer exists', code: 'ROOM_GONE' });
  }

  req.auth = payload;
  req.room = room;
  return next();
});

module.exports = { requireAuth, extractToken };
