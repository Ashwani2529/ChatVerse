const express = require('express');

const PushSubscription = require('../models/PushSubscription');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { getPublicKey, isConfigured } = require('../services/push');

const router = express.Router();

/** The browser needs the VAPID public key before it can subscribe. */
router.get('/public-key', (req, res) => {
  res.json({ publicKey: getPublicKey(), enabled: isConfigured });
});

/**
 * POST /api/push/subscribe
 * Stores (or refreshes) this browser's push endpoint against the member's room.
 */
router.post(
  '/subscribe',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { endpoint, keys } = req.body?.subscription || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid push subscription' });
    }

    // Keyed on endpoint so re-subscribing the same browser updates in place —
    // and so a browser that switches rooms stops getting the old room's pushes.
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        roomId: req.auth.roomId,
        memberId: req.auth.memberId,
        name: req.auth.name,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ ok: true });
  })
);

/** POST /api/push/unsubscribe — called when the user mutes or leaves. */
router.post(
  '/unsubscribe',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { endpoint } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }

    await PushSubscription.deleteOne({ endpoint, memberId: req.auth.memberId });

    return res.json({ ok: true });
  })
);

module.exports = router;
