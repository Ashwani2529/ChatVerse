const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const roomSchema = new mongoose.Schema(
  {
    // Lower-cased room id so "Team-A" and "team-a" are the same room.
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 40,
    },
    // Whatever casing the creator originally typed, for display purposes.
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

roomSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

roomSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('Room', roomSchema);
