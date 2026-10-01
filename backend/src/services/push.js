const webpush = require('web-push');

const PushSubscription = require('../models/PushSubscription');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@chatverse.app';

const isConfigured = Boolean(publicKey && privateKey);

if (isConfigured) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn(
    '⚠️  VAPID keys missing — push notifications are disabled. ' +
      'Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable them.'
  );
}

const getPublicKey = () => (isConfigured ? publicKey : null);

const PREVIEW_LENGTH = 120;

const buildPayload = (message, roomDisplayName) =>
  JSON.stringify({
    title: message.user,
    body:
      message.text.length > PREVIEW_LENGTH
        ? `${message.text.slice(0, PREVIEW_LENGTH)}…`
        : message.text,
    roomId: message.roomId,
    roomName: roomDisplayName,
    messageId: message._id,
    at: message.createdAt,
  });

/**
 * Pushes a message to everyone subscribed in the room except the sender and
 * anyone listed in `skipMemberIds` — those members have the app open, so their
 * own tab raises the notification and a push would duplicate it.
 */
const notifyRoom = async ({ message, roomDisplayName, skipMemberIds = [] }) => {
  if (!isConfigured) return;

  const excluded = [...new Set([message.memberId, ...skipMemberIds])];

  const subscriptions = await PushSubscription.find({
    roomId: message.roomId,
    memberId: { $nin: excluded },
  }).lean();

  if (subscriptions.length === 0) return;

  const payload = buildPayload(message, roomDisplayName);
  const expired = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          payload,
          { TTL: 60 * 60, urgency: 'high' }
        );
      } catch (error) {
        // 404/410 mean the browser threw the subscription away for good.
        if (error.statusCode === 404 || error.statusCode === 410) {
          expired.push(subscription.endpoint);
        } else {
          console.error(
            `Push failed (${error.statusCode || 'no status'}):`,
            error.body || error.message
          );
        }
      }
    })
  );

  if (expired.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expired } });
    console.log(`Removed ${expired.length} expired push subscription(s)`);
  }
};

module.exports = { notifyRoom, getPublicKey, isConfigured };
