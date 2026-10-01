const mongoose = require('mongoose');

const SIXTY_DAYS_SECONDS = 60 * 24 * 60 * 60;

const pushSubscriptionSchema = new mongoose.Schema(
  {
    // The browser's push endpoint uniquely identifies a device+browser pair.
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    roomId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    memberId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Who to notify for a given room.
pushSubscriptionSchema.index({ roomId: 1, memberId: 1 });

// Subscriptions die with the login token that created them, so there is no
// point keeping them past 60 days of silence.
pushSubscriptionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: SIXTY_DAYS_SECONDS });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
