// Works for both hydrated Mongoose documents and `.lean()` results.
const serializeMessage = (doc) => ({
  _id: String(doc._id),
  roomId: doc.roomId,
  memberId: doc.memberId,
  user: doc.user,
  text: doc.text,
  kind: doc.kind || 'chat',
  createdAt:
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : new Date(doc.createdAt).toISOString(),
});

module.exports = { serializeMessage };
