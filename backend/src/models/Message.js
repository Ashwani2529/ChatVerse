const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Stable per-person id carried in the JWT, so a user's own messages are
    // still recognised as theirs across reconnects and devices.
    memberId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    kind: {
      type: String,
      enum: ['chat', 'system'],
      default: 'chat',
    },
  },
  { timestamps: true }
);

// Drives both the newest-first history page and the scroll-up pagination.
messageSchema.index({ roomId: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('Message', messageSchema);
